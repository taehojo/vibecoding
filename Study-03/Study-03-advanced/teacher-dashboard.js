const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

class TeacherDashboard {
    constructor() {
        this.commands = [
            { name: '학생 데이터 생성', file: 'student-data-generator.js' },
            { name: '성적 분석', file: 'grade-analyzer.js' },
            { name: '학생 비교', file: 'student-comparison.js' },
            { name: 'HTML 보고서 생성', file: 'teacher-report.js' },
            { name: 'CSV 파일 내보내기', file: 'export-report.js' }
        ];
        this.results = [];
        this.startTime = Date.now();
    }

    displayHeader() {
        console.log('\n╔════════════════════════════════════╗');
        console.log('║     🎓 교사 대시보드 시작          ║');
        console.log('║     Teacher Dashboard v1.0         ║');
        console.log('╚════════════════════════════════════╝\n');
    }

    async executeCommand(command, index) {
        const stepStart = Date.now();
        console.log(`[${index + 1}/${this.commands.length}] ${command.name}`);
        
        try {
            const { stdout, stderr } = await execAsync(`node ${command.file}`);
            
            if (stderr && !stderr.includes('Warning')) {
                throw new Error(stderr);
            }
            
            const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
            console.log(`✅ 완료 (${duration}초)\n`);
            
            this.results.push({
                name: command.name,
                status: 'success',
                duration: duration,
                output: stdout
            });
            
            return true;
        } catch (error) {
            const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
            console.log(`❌ 실패 (${duration}초)`);
            console.log(`  오류: ${error.message.split('\n')[0]}\n`);
            
            this.results.push({
                name: command.name,
                status: 'failed',
                duration: duration,
                error: error.message
            });
            
            return false;
        }
    }

    async checkGeneratedFiles() {
        const today = new Date().toISOString().split('T')[0];
        const files = [
            { name: 'student_data.json', required: true },
            { name: `teacher_report_${today}.html`, required: true },
            { name: `report_summary_${today}.csv`, required: false },
            { name: `report_detailed_${today}.csv`, required: false }
        ];
        
        const fileStatuses = [];
        
        for (const file of files) {
            try {
                const stats = await fs.stat(file.name);
                const size = (stats.size / 1024).toFixed(0);
                fileStatuses.push({
                    name: file.name,
                    exists: true,
                    size: `${size}KB`
                });
            } catch {
                if (file.required) {
                    fileStatuses.push({
                        name: file.name,
                        exists: false
                    });
                }
            }
        }
        
        return fileStatuses;
    }

    displaySummary() {
        const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
        const successCount = this.results.filter(r => r.status === 'success').length;
        const completionRate = ((successCount / this.commands.length) * 100).toFixed(0);
        
        console.log('╔════════════════════════════════════╗');
        console.log('║         📊 실행 결과 요약          ║');
        console.log('╚════════════════════════════════════╝\n');
        
        console.log(`🔸 완료율: ${successCount}/${this.commands.length} (${completionRate}%)`);
        console.log(`🔸 총 실행 시간: ${totalDuration}초`);
        
        if (successCount < this.commands.length) {
            console.log('\n❌ 실패한 작업:');
            this.results
                .filter(r => r.status === 'failed')
                .forEach(r => {
                    console.log(`  - ${r.name}: ${r.error.split('\n')[0]}`);
                });
        }
    }

    async displayFileStatus() {
        const files = await this.checkGeneratedFiles();
        
        if (files.length > 0) {
            console.log('\n🔸 생성된 파일:');
            files.forEach(file => {
                if (file.exists) {
                    console.log(`  ✅ ${file.name} (${file.size})`);
                } else {
                    console.log(`  ❌ ${file.name} (생성 실패)`);
                }
            });
        }
    }

    extractKeyMetrics() {
        const metrics = {
            totalStudents: 0,
            avgScore: 0,
            topPerformers: 0,
            needsHelp: 0
        };
        
        try {
            const studentData = require('./student_data.json');
            metrics.totalStudents = studentData.students.length;
            
            const scores = studentData.students.map(s => s.totalScore);
            metrics.avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            metrics.topPerformers = scores.filter(s => s >= 90).length;
            metrics.needsHelp = scores.filter(s => s < 70).length;
        } catch {
            // 파일이 없거나 읽기 실패 시 기본값 유지
        }
        
        return metrics;
    }

    displayMetrics() {
        const metrics = this.extractKeyMetrics();
        
        if (metrics.totalStudents > 0) {
            console.log('\n📈 주요 지표:');
            console.log(`  • 총 학생 수: ${metrics.totalStudents}명`);
            console.log(`  • 평균 점수: ${metrics.avgScore}점`);
            console.log(`  • 우수 학생: ${metrics.topPerformers}명 (90점 이상)`);
            console.log(`  • 보충 필요: ${metrics.needsHelp}명 (70점 미만)`);
        }
    }

    async run() {
        this.displayHeader();
        
        let shouldContinue = true;
        
        for (let i = 0; i < this.commands.length && shouldContinue; i++) {
            const success = await this.executeCommand(this.commands[i], i);
            
            if (!success && this.commands[i].name.includes('데이터 생성')) {
                console.log('⚠️  핵심 데이터 생성 실패로 실행을 중단합니다.\n');
                shouldContinue = false;
            }
        }
        
        this.displaySummary();
        await this.displayFileStatus();
        this.displayMetrics();
        
        console.log('\n✨ 교사 대시보드 실행 완료\n');
        
        if (this.results.filter(r => r.status === 'success').length === this.commands.length) {
            console.log('💡 팁: 생성된 HTML 보고서를 브라우저에서 열어보세요.');
            console.log('   CSV 파일은 Excel에서 열어 추가 분석이 가능합니다.\n');
        }
    }
}

async function main() {
    const dashboard = new TeacherDashboard();
    
    try {
        await dashboard.run();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 예상치 못한 오류가 발생했습니다:');
        console.error(error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = TeacherDashboard;