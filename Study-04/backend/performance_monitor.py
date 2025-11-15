"""
Comprehensive performance monitoring and profiling utilities
"""
import time
import psutil
import threading
import tracemalloc
import functools
import logging
from collections import deque, defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
import json
import os
import gc

logger = logging.getLogger(__name__)

class PerformanceMetrics:
    """Container for performance metrics"""

    def __init__(self):
        self.start_time = time.time()
        self.end_time = None
        self.duration = None
        self.memory_before = 0
        self.memory_after = 0
        self.memory_peak = 0
        self.cpu_percent = 0
        self.io_counters = None
        self.exception = None
        self.result = None

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'duration': self.duration,
            'memory_used': self.memory_after - self.memory_before,
            'memory_peak': self.memory_peak,
            'cpu_percent': self.cpu_percent,
            'success': self.exception is None,
            'timestamp': datetime.fromtimestamp(self.start_time).isoformat()
        }


class PerformanceMonitor:
    """Advanced performance monitoring system"""

    def __init__(self, enable_memory_profiling: bool = True):
        """
        Initialize performance monitor

        Args:
            enable_memory_profiling: Enable memory profiling (has overhead)
        """
        self.enable_memory_profiling = enable_memory_profiling

        # Metrics storage
        self.metrics_history = defaultdict(lambda: deque(maxlen=1000))
        self.slow_operations = deque(maxlen=100)
        self.memory_snapshots = deque(maxlen=10)

        # Thresholds
        self.slow_threshold = 1.0  # seconds
        self.memory_threshold = 100 * 1024 * 1024  # 100MB

        # System metrics
        self.process = psutil.Process()

        # Thread safety
        self._lock = threading.Lock()

        # Background monitoring
        self._monitoring_thread = None
        self._stop_monitoring = threading.Event()

        # Start memory tracking if enabled
        if self.enable_memory_profiling:
            tracemalloc.start()

    def start_background_monitoring(self, interval: int = 60):
        """Start background system monitoring"""
        def monitor_worker():
            while not self._stop_monitoring.is_set():
                try:
                    self.collect_system_metrics()
                    self._stop_monitoring.wait(interval)
                except Exception as e:
                    logger.error(f"Background monitoring error: {e}")

        self._monitoring_thread = threading.Thread(target=monitor_worker)
        self._monitoring_thread.daemon = True
        self._monitoring_thread.start()

    def collect_system_metrics(self) -> Dict:
        """Collect current system metrics"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': {
                'total': psutil.virtual_memory().total,
                'available': psutil.virtual_memory().available,
                'percent': psutil.virtual_memory().percent,
                'used': psutil.virtual_memory().used
            },
            'disk': {
                'total': psutil.disk_usage('/').total,
                'used': psutil.disk_usage('/').used,
                'percent': psutil.disk_usage('/').percent
            },
            'process': {
                'cpu_percent': self.process.cpu_percent(),
                'memory_rss': self.process.memory_info().rss,
                'memory_vms': self.process.memory_info().vms,
                'num_threads': self.process.num_threads(),
                'num_fds': len(self.process.open_files()) if hasattr(self.process, 'open_files') else 0
            }
        }

        # Network I/O if available
        try:
            io_counters = psutil.net_io_counters()
            metrics['network'] = {
                'bytes_sent': io_counters.bytes_sent,
                'bytes_recv': io_counters.bytes_recv,
                'packets_sent': io_counters.packets_sent,
                'packets_recv': io_counters.packets_recv
            }
        except:
            pass

        with self._lock:
            self.metrics_history['system'].append(metrics)

        return metrics

    def measure_function(self, func: Callable) -> Callable:
        """Decorator to measure function performance"""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            metrics = PerformanceMetrics()

            # Measure memory before
            if self.enable_memory_profiling:
                gc.collect()
                metrics.memory_before = self.process.memory_info().rss

            # Measure CPU before
            cpu_before = self.process.cpu_percent()

            try:
                # Execute function
                metrics.result = func(*args, **kwargs)

            except Exception as e:
                metrics.exception = e
                raise

            finally:
                # Calculate duration
                metrics.end_time = time.time()
                metrics.duration = metrics.end_time - metrics.start_time

                # Measure memory after
                if self.enable_memory_profiling:
                    gc.collect()
                    metrics.memory_after = self.process.memory_info().rss
                    metrics.memory_peak = max(metrics.memory_before, metrics.memory_after)

                # Measure CPU
                metrics.cpu_percent = self.process.cpu_percent() - cpu_before

                # Record metrics
                self._record_metrics(func.__name__, metrics)

            return metrics.result

        return wrapper

    def _record_metrics(self, operation_name: str, metrics: PerformanceMetrics):
        """Record performance metrics"""
        with self._lock:
            # Store in history
            self.metrics_history[operation_name].append(metrics.to_dict())

            # Check for slow operations
            if metrics.duration > self.slow_threshold:
                self.slow_operations.append({
                    'operation': operation_name,
                    'duration': metrics.duration,
                    'timestamp': datetime.fromtimestamp(metrics.start_time).isoformat()
                })
                logger.warning(f"Slow operation detected: {operation_name} took {metrics.duration:.2f}s")

            # Check for high memory usage
            memory_used = metrics.memory_after - metrics.memory_before
            if memory_used > self.memory_threshold:
                logger.warning(f"High memory usage: {operation_name} used {memory_used / 1024 / 1024:.1f}MB")

    def profile_memory(self):
        """Take a memory snapshot"""
        if not self.enable_memory_profiling:
            return None

        snapshot = tracemalloc.take_snapshot()
        top_stats = snapshot.statistics('lineno')

        memory_profile = {
            'timestamp': datetime.now().isoformat(),
            'total_memory': sum(stat.size for stat in top_stats),
            'top_allocations': []
        }

        for stat in top_stats[:10]:  # Top 10 memory users
            memory_profile['top_allocations'].append({
                'file': stat.traceback.format()[0] if stat.traceback else 'unknown',
                'size': stat.size,
                'count': stat.count
            })

        with self._lock:
            self.memory_snapshots.append(memory_profile)

        return memory_profile

    def get_performance_report(self, operation: Optional[str] = None) -> Dict:
        """Generate performance report"""
        with self._lock:
            if operation:
                history = list(self.metrics_history.get(operation, []))
            else:
                # Aggregate all operations
                history = []
                for op_history in self.metrics_history.values():
                    history.extend(op_history)

            if not history:
                return {'error': 'No metrics available'}

            # Calculate statistics
            durations = [m['duration'] for m in history if m['duration']]
            memory_usage = [m['memory_used'] for m in history if 'memory_used' in m]

            report = {
                'operation': operation or 'all',
                'sample_count': len(history),
                'duration': {
                    'min': min(durations) if durations else 0,
                    'max': max(durations) if durations else 0,
                    'avg': sum(durations) / len(durations) if durations else 0,
                    'p50': self._percentile(durations, 50),
                    'p95': self._percentile(durations, 95),
                    'p99': self._percentile(durations, 99)
                },
                'memory': {
                    'min': min(memory_usage) if memory_usage else 0,
                    'max': max(memory_usage) if memory_usage else 0,
                    'avg': sum(memory_usage) / len(memory_usage) if memory_usage else 0
                },
                'success_rate': sum(1 for m in history if m.get('success', True)) / len(history),
                'slow_operations': list(self.slow_operations)[-10:],
                'recent_metrics': history[-10:]
            }

            # Add current system metrics
            if self.metrics_history['system']:
                report['current_system'] = self.metrics_history['system'][-1]

            return report

    @staticmethod
    def _percentile(data: List[float], percentile: int) -> float:
        """Calculate percentile"""
        if not data:
            return 0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]

    def export_metrics(self, filepath: str):
        """Export metrics to JSON file"""
        with self._lock:
            metrics_data = {
                'exported_at': datetime.now().isoformat(),
                'metrics_history': {
                    op: list(history) for op, history in self.metrics_history.items()
                },
                'slow_operations': list(self.slow_operations),
                'memory_snapshots': list(self.memory_snapshots)
            }

        with open(filepath, 'w') as f:
            json.dump(metrics_data, f, indent=2)

        logger.info(f"Metrics exported to {filepath}")

    def stop(self):
        """Stop monitoring"""
        self._stop_monitoring.set()
        if self._monitoring_thread:
            self._monitoring_thread.join(timeout=1)

        if self.enable_memory_profiling:
            tracemalloc.stop()


class RequestProfiler:
    """Profile individual requests with detailed metrics"""

    def __init__(self):
        self.active_requests = {}
        self._lock = threading.Lock()

    def start_request(self, request_id: str, metadata: Optional[Dict] = None) -> Dict:
        """Start profiling a request"""
        profile = {
            'request_id': request_id,
            'start_time': time.time(),
            'metadata': metadata or {},
            'checkpoints': [],
            'queries': [],
            'external_calls': []
        }

        with self._lock:
            self.active_requests[request_id] = profile

        return profile

    def add_checkpoint(self, request_id: str, checkpoint_name: str, data: Optional[Dict] = None):
        """Add a checkpoint to request profile"""
        with self._lock:
            if request_id in self.active_requests:
                checkpoint = {
                    'name': checkpoint_name,
                    'timestamp': time.time(),
                    'data': data or {}
                }
                self.active_requests[request_id]['checkpoints'].append(checkpoint)

    def add_query(self, request_id: str, query: str, duration: float):
        """Record a database query"""
        with self._lock:
            if request_id in self.active_requests:
                self.active_requests[request_id]['queries'].append({
                    'query': query[:100],  # Truncate long queries
                    'duration': duration,
                    'timestamp': time.time()
                })

    def add_external_call(self, request_id: str, service: str, endpoint: str, duration: float):
        """Record an external API call"""
        with self._lock:
            if request_id in self.active_requests:
                self.active_requests[request_id]['external_calls'].append({
                    'service': service,
                    'endpoint': endpoint,
                    'duration': duration,
                    'timestamp': time.time()
                })

    def end_request(self, request_id: str, status: str = 'success') -> Optional[Dict]:
        """End request profiling and return profile"""
        with self._lock:
            if request_id not in self.active_requests:
                return None

            profile = self.active_requests.pop(request_id)

        profile['end_time'] = time.time()
        profile['duration'] = profile['end_time'] - profile['start_time']
        profile['status'] = status

        # Calculate checkpoint durations
        last_time = profile['start_time']
        for checkpoint in profile['checkpoints']:
            checkpoint['duration'] = checkpoint['timestamp'] - last_time
            last_time = checkpoint['timestamp']

        # Summary statistics
        profile['summary'] = {
            'total_duration': profile['duration'],
            'query_count': len(profile['queries']),
            'query_time': sum(q['duration'] for q in profile['queries']),
            'external_call_count': len(profile['external_calls']),
            'external_call_time': sum(c['duration'] for c in profile['external_calls'])
        }

        return profile


class BottleneckDetector:
    """Detect performance bottlenecks in the application"""

    def __init__(self, monitor: PerformanceMonitor):
        self.monitor = monitor
        self.bottlenecks = []

    def analyze(self) -> List[Dict]:
        """Analyze metrics and detect bottlenecks"""
        self.bottlenecks = []

        # Check for slow operations
        report = self.monitor.get_performance_report()

        # Detect slow operations
        if report.get('duration', {}).get('p95', 0) > 2.0:
            self.bottlenecks.append({
                'type': 'slow_operations',
                'severity': 'high',
                'description': f"95th percentile response time is {report['duration']['p95']:.2f}s",
                'recommendation': 'Profile slow operations and optimize algorithms'
            })

        # Detect memory issues
        if report.get('memory', {}).get('max', 0) > 500 * 1024 * 1024:  # 500MB
            self.bottlenecks.append({
                'type': 'high_memory',
                'severity': 'high',
                'description': f"Maximum memory usage is {report['memory']['max'] / 1024 / 1024:.1f}MB",
                'recommendation': 'Implement memory pooling and optimize data structures'
            })

        # Check system metrics
        if 'current_system' in report:
            system = report['current_system']

            # High CPU usage
            if system['cpu_percent'] > 80:
                self.bottlenecks.append({
                    'type': 'high_cpu',
                    'severity': 'medium',
                    'description': f"CPU usage is {system['cpu_percent']}%",
                    'recommendation': 'Optimize CPU-intensive operations or scale horizontally'
                })

            # High memory usage
            if system['memory']['percent'] > 90:
                self.bottlenecks.append({
                    'type': 'memory_pressure',
                    'severity': 'high',
                    'description': f"System memory usage is {system['memory']['percent']}%",
                    'recommendation': 'Reduce memory footprint or increase system memory'
                })

        return self.bottlenecks

    def get_optimization_suggestions(self) -> List[str]:
        """Get optimization suggestions based on detected bottlenecks"""
        suggestions = []

        for bottleneck in self.bottlenecks:
            if bottleneck['type'] == 'slow_operations':
                suggestions.extend([
                    "Implement caching for frequently accessed data",
                    "Use database connection pooling",
                    "Optimize database queries with proper indexing",
                    "Consider asynchronous processing for heavy operations"
                ])

            elif bottleneck['type'] == 'high_memory':
                suggestions.extend([
                    "Implement object pooling to reduce allocations",
                    "Use generators instead of loading all data into memory",
                    "Compress large data structures",
                    "Implement pagination for large result sets"
                ])

            elif bottleneck['type'] == 'high_cpu':
                suggestions.extend([
                    "Profile CPU hotspots and optimize algorithms",
                    "Use caching to avoid repeated computations",
                    "Implement worker pools for parallel processing",
                    "Consider using more efficient data structures"
                ])

        return list(set(suggestions))  # Remove duplicates


# Global monitor instance
_global_monitor = PerformanceMonitor()
_global_profiler = RequestProfiler()


def monitor_performance(func: Callable) -> Callable:
    """Decorator to monitor function performance"""
    return _global_monitor.measure_function(func)


def get_performance_report() -> Dict:
    """Get global performance report"""
    return _global_monitor.get_performance_report()


def profile_request(request_id: str):
    """Context manager for request profiling"""
    class RequestContext:
        def __enter__(self):
            _global_profiler.start_request(request_id)
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            status = 'error' if exc_type else 'success'
            _global_profiler.end_request(request_id, status)

        def checkpoint(self, name: str, **data):
            _global_profiler.add_checkpoint(request_id, name, data)

    return RequestContext()


# Start background monitoring
_global_monitor.start_background_monitoring()