const fs = require('fs');

class TeacherReportGenerator {
    constructor() {
        const data = JSON.parse(fs.readFileSync('student_data.json', 'utf8'));
        // Handle both array and object with students property
        this.students = Array.isArray(data) ? data : data.students;
        this.reportDate = new Date().toISOString().split('T')[0];
        this.reportName = `teacher_report_${this.reportDate}.html`;
        this.gradeColors = {
            'A': '#27ae60',
            'B': '#3498db', 
            'C': '#f39c12',
            'D': '#e74c3c'
        };
    }

    calculateStatistics() {
        const students = this.students;
        const scores = students.map(s => s.averageScore || s.totalScore || 0);
        
        return {
            totalStudents: students.length,
            avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
            maxScore: Math.max(...scores),
            minScore: Math.min(...scores),
            stdDev: this.calculateStdDev(scores).toFixed(1),
            gradeDistribution: this.getGradeDistribution(),
            categoryAvgs: this.getCategoryAverages(),
            topPerformers: students.filter(s => (s.averageScore || s.totalScore || 0) >= 90).sort((a, b) => (b.averageScore || b.totalScore || 0) - (a.averageScore || a.totalScore || 0)).slice(0, 5),
            needsImprovement: students.filter(s => (s.averageScore || s.totalScore || 0) < 70).sort((a, b) => (a.averageScore || a.totalScore || 0) - (b.averageScore || b.totalScore || 0)).slice(0, 5)
        };
    }

    calculateStdDev(scores) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
        return Math.sqrt(avgSquaredDiff);
    }

    getGradeDistribution() {
        const distribution = { A: 0, B: 0, C: 0, D: 0 };
        this.students.forEach(student => {
            if (student.grade) {
                distribution[student.grade] = (distribution[student.grade] || 0) + 1;
            }
        });
        return distribution;
    }

    getCategoryAverages() {
        const categories = {};
        this.students.forEach(student => {
            // Try different structures for subjects/categories
            const subjects = student.subjects || student.categoryScores || {};
            if (student.quizHistory && student.quizHistory.length > 0) {
                // Aggregate from quiz history
                student.quizHistory.forEach(quiz => {
                    if (quiz.categoryScores) {
                        Object.entries(quiz.categoryScores).forEach(([subject, data]) => {
                            if (!categories[subject]) {
                                categories[subject] = { total: 0, count: 0 };
                            }
                            categories[subject].total += data.percentage || 0;
                            categories[subject].count++;
                        });
                    }
                });
            } else {
                Object.entries(subjects).forEach(([subject, score]) => {
                    if (!categories[subject]) {
                        categories[subject] = { total: 0, count: 0 };
                    }
                    categories[subject].total += score;
                    categories[subject].count++;
                });
            }
        });
        
        const averages = {};
        Object.entries(categories).forEach(([subject, data]) => {
            averages[subject] = (data.total / data.count).toFixed(1);
        });
        return averages;
    }

    generateHTML() {
        const stats = this.calculateStatistics();
        
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>학급 성적 종합 보고서 - ${this.reportDate}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header .date {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
        }
        
        .stat-card .label {
            color: #7f8c8d;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .chart-container {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        
        .chart-container h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .grade-bars {
            display: flex;
            justify-content: space-around;
            align-items: flex-end;
            height: 200px;
            margin-bottom: 20px;
        }
        
        .grade-bar {
            width: 20%;
            background: linear-gradient(to top, var(--color) 0%, var(--color-light) 100%);
            border-radius: 10px 10px 0 0;
            position: relative;
            transition: transform 0.3s;
        }
        
        .grade-bar:hover {
            transform: scaleY(1.05);
        }
        
        .grade-bar .label {
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            font-size: 1.2em;
        }
        
        .grade-bar .count {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            color: #2c3e50;
        }
        
        .students-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .student-list {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
        }
        
        .student-list h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.4em;
        }
        
        .student-list.top h3 {
            color: #27ae60;
        }
        
        .student-list.needs-help h3 {
            color: #e74c3c;
        }
        
        .student-item {
            background: white;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.2s;
        }
        
        .student-item:hover {
            transform: translateX(5px);
        }
        
        .student-name {
            font-weight: 500;
            color: #2c3e50;
        }
        
        .student-score {
            font-weight: bold;
            padding: 5px 10px;
            border-radius: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .category-chart {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        
        .category-bars {
            margin-top: 20px;
        }
        
        .category-item {
            margin-bottom: 15px;
        }
        
        .category-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            color: #2c3e50;
            font-weight: 500;
        }
        
        .category-bar-bg {
            background: #e0e0e0;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
        }
        
        .category-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            transition: width 1s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: bold;
        }
        
        .recommendations {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-top: 30px;
        }
        
        .recommendations h2 {
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .recommendations ul {
            list-style: none;
            padding-left: 0;
        }
        
        .recommendations li {
            padding: 10px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .recommendations li:last-child {
            border-bottom: none;
        }
        
        .recommendations li::before {
            content: "✓ ";
            font-weight: bold;
            margin-right: 10px;
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr 1fr;
            }
            
            .students-section {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 1.8em;
            }
        }
        
        @media print {
            body {
                background: white;
            }
            
            .container {
                box-shadow: none;
            }
            
            .stat-card:hover,
            .grade-bar:hover,
            .student-item:hover {
                transform: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 학급 성적 종합 보고서</h1>
            <div class="date">📅 ${this.reportDate}</div>
        </div>
        
        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="label">총 학생 수</div>
                    <div class="value">${stats.totalStudents}</div>
                </div>
                <div class="stat-card">
                    <div class="label">평균 점수</div>
                    <div class="value">${stats.avgScore}</div>
                </div>
                <div class="stat-card">
                    <div class="label">최고 점수</div>
                    <div class="value">${stats.maxScore}</div>
                </div>
                <div class="stat-card">
                    <div class="label">최저 점수</div>
                    <div class="value">${stats.minScore}</div>
                </div>
                <div class="stat-card">
                    <div class="label">표준 편차</div>
                    <div class="value">${stats.stdDev}</div>
                </div>
                <div class="stat-card">
                    <div class="label">우수 학생</div>
                    <div class="value">${stats.topPerformers.length}</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h2>📊 등급 분포 (상대평가)</h2>
                <div class="grade-bars">
                    ${Object.entries(stats.gradeDistribution).map(([grade, count]) => {
                        const percentage = (count / stats.totalStudents * 100).toFixed(0);
                        const height = (count / Math.max(...Object.values(stats.gradeDistribution)) * 100);
                        const color = this.gradeColors[grade];
                        return `
                        <div class="grade-bar" style="height: ${height}%; --color: ${color}; --color-light: ${color}88;">
                            <div class="count">${count}명 (${percentage}%)</div>
                            <div class="label">${grade}등급</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            
            <div class="students-section">
                <div class="student-list top">
                    <h3>🏆 우수 학생 (90점 이상)</h3>
                    ${stats.topPerformers.length > 0 ? 
                        stats.topPerformers.map(student => `
                        <div class="student-item">
                            <span class="student-name">${student.name || student.studentName || 'Unknown'}</span>
                            <span class="student-score">${student.averageScore || student.totalScore || 0}점</span>
                        </div>`).join('') :
                        '<p style="color: #7f8c8d; text-align: center;">해당 학생이 없습니다</p>'
                    }
                </div>
                
                <div class="student-list needs-help">
                    <h3>📚 보충 필요 (70점 미만)</h3>
                    ${stats.needsImprovement.length > 0 ?
                        stats.needsImprovement.map(student => `
                        <div class="student-item">
                            <span class="student-name">${student.name || student.studentName || 'Unknown'}</span>
                            <span class="student-score">${student.averageScore || student.totalScore || 0}점</span>
                        </div>`).join('') :
                        '<p style="color: #7f8c8d; text-align: center;">해당 학생이 없습니다</p>'
                    }
                </div>
            </div>
            
            <div class="category-chart">
                <h2>📈 과목별 평균 점수</h2>
                <div class="category-bars">
                    ${Object.entries(stats.categoryAvgs).map(([subject, avg]) => `
                    <div class="category-item">
                        <div class="category-label">
                            <span>${subject}</span>
                            <span>${avg}점</span>
                        </div>
                        <div class="category-bar-bg">
                            <div class="category-bar-fill" style="width: ${avg}%;">
                            </div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>
            
            <div class="recommendations">
                <h2>💡 종합 분석 및 개선 방안</h2>
                <ul>
                    ${this.generateRecommendations(stats).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    generateRecommendations(stats) {
        const recommendations = [];
        
        // 평균 점수 기반 추천
        if (parseFloat(stats.avgScore) < 70) {
            recommendations.push('전반적인 학습 수준 향상이 필요합니다. 기초 개념 복습 시간을 늘려주세요.');
        } else if (parseFloat(stats.avgScore) >= 85) {
            recommendations.push('학급 전체 성취도가 우수합니다. 심화 학습을 통해 더 높은 목표를 설정하세요.');
        }
        
        // 표준편차 기반 추천
        if (parseFloat(stats.stdDev) > 15) {
            recommendations.push('학생 간 성취도 격차가 큽니다. 수준별 맞춤 학습이 필요합니다.');
        }
        
        // 하위권 학생 비율 기반 추천
        const lowPerformersRatio = stats.needsImprovement.length / stats.totalStudents;
        if (lowPerformersRatio > 0.3) {
            recommendations.push('보충이 필요한 학생이 많습니다. 방과 후 보충 수업을 고려해보세요.');
        }
        
        // 과목별 분석
        const weakSubjects = Object.entries(stats.categoryAvgs)
            .filter(([_, avg]) => parseFloat(avg) < 70)
            .map(([subject, _]) => subject);
        
        if (weakSubjects.length > 0) {
            recommendations.push(`${weakSubjects.join(', ')} 과목의 집중 지도가 필요합니다.`);
        }
        
        // 상위권 학생 관리
        if (stats.topPerformers.length > 0) {
            recommendations.push('우수 학생들을 위한 심화 학습 프로그램을 운영하면 좋겠습니다.');
        }
        
        // 기본 추천사항
        recommendations.push('정기적인 형성평가를 통해 학습 진도를 점검하세요.');
        recommendations.push('학부모와의 소통을 강화하여 가정 학습을 독려하세요.');
        
        return recommendations.slice(0, 6); // 최대 6개 추천
    }

    generate() {
        const html = this.generateHTML();
        fs.writeFileSync(this.reportName, html, 'utf8');
        
        console.log('╔════════════════════════════════════╗');
        console.log('║     📊 HTML 보고서 생성 완료       ║');
        console.log('╚════════════════════════════════════╝\n');
        console.log(`✅ 파일명: ${this.reportName}`);
        console.log(`📁 크기: ${(Buffer.byteLength(html) / 1024).toFixed(1)}KB`);
        console.log('\n💡 브라우저에서 열어 확인하세요.');
    }
}

// 실행
if (require.main === module) {
    try {
        const generator = new TeacherReportGenerator();
        generator.generate();
    } catch (error) {
        console.error('❌ 보고서 생성 실패:', error.message);
        process.exit(1);
    }
}

module.exports = TeacherReportGenerator;