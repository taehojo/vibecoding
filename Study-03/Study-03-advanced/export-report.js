#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// HTML 파일 찾기
const files = fs.readdirSync(process.cwd());
const htmlFiles = files.filter(f => f.startsWith('teacher_report_') && f.endsWith('.html'));

if (htmlFiles.length === 0) {
    console.log('⚠️ teacher_report HTML 파일이 없습니다.');
    console.log('   먼저 node teacher-report.js를 실행하세요.');
    process.exit(1);
}

// 가장 최근 파일 선택
const latestHtml = htmlFiles.sort().pop();
const htmlPath = path.join(process.cwd(), latestHtml);
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

console.log(`📄 HTML 파일 읽기: ${latestHtml}`);

// HTML에서 데이터 추출
const extractData = (html) => {
    const data = {
        date: '',
        totalStudents: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        topStudents: []
    };
    
    // 날짜 추출
    const dateMatch = html.match(/생성일시: ([^<]+)</);
    if (dateMatch) data.date = dateMatch[1];
    
    // 통계 추출
    const statsMatch = html.match(/총 학생 수.*?(\d+)명.*?전체 평균.*?([\d.]+)점.*?최고 점수.*?(\d+)점.*?최저 점수.*?(\d+)점/s);
    if (statsMatch) {
        data.totalStudents = parseInt(statsMatch[1]);
        data.avgScore = parseFloat(statsMatch[2]);
        data.maxScore = parseInt(statsMatch[3]);
        data.minScore = parseInt(statsMatch[4]);
    }
    
    // 상위 학생 추출
    const tableMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (tableMatch) {
        const rows = tableMatch[1].match(/<tr>[\s\S]*?<\/tr>/g) || [];
        rows.forEach(row => {
            const cells = row.match(/<td>([^<]*)<\/td>/g);
            if (cells && cells.length >= 5) {
                const student = {
                    rank: cells[0].replace(/<[^>]*>/g, ''),
                    name: cells[1].replace(/<[^>]*>/g, ''),
                    class: cells[2].replace(/<[^>]*>/g, ''),
                    score: cells[3].replace(/<[^>]*>/g, ''),
                    grade: cells[4].match(/>([A-D])</)?.[1] || ''
                };
                data.topStudents.push(student);
            }
        });
    }
    
    return data;
};

const data = extractData(htmlContent);

// CSV 생성
const createCSV = (data) => {
    let csv = '성적 보고서 요약\n';
    csv += `생성일시,${data.date}\n`;
    csv += `총 학생 수,${data.totalStudents}명\n`;
    csv += `전체 평균,${data.avgScore}점\n`;
    csv += `최고 점수,${data.maxScore}점\n`;
    csv += `최저 점수,${data.minScore}점\n`;
    csv += '\n';
    csv += '상위 5명 학생\n';
    csv += '순위,이름,반,평균 점수,등급\n';
    
    data.topStudents.forEach(s => {
        csv += `${s.rank},${s.name},${s.class},${s.score},${s.grade}\n`;
    });
    
    csv += '\n';
    csv += '등급 기준 (상대평가)\n';
    csv += 'A등급,상위 20%\n';
    csv += 'B등급,상위 21-40%\n';
    csv += 'C등급,상위 41-70%\n';
    csv += 'D등급,하위 30%\n';
    
    return csv;
};

// 전체 학생 데이터도 포함하는 상세 CSV
const createDetailedCSV = () => {
    const dataPath = path.join(process.cwd(), 'student_data.json');
    if (!fs.existsSync(dataPath)) {
        return null;
    }
    
    const students = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    let csv = '학생ID,이름,반,평균점수,등급,퀴즈횟수\n';
    
    students.sort((a, b) => b.averageScore - a.averageScore);
    students.forEach(s => {
        csv += `${s.id},${s.name},${s.class},${s.averageScore},${s.grade},${s.quizHistory.length}\n`;
    });
    
    return csv;
};

// CSV 파일 저장
const csvContent = createCSV(data);
const csvPath = path.join(process.cwd(), `report_summary_${new Date().toISOString().split('T')[0]}.csv`);
fs.writeFileSync(csvPath, '\ufeff' + csvContent); // BOM 추가 (한글 엑셀 호환)

console.log(`✅ CSV 요약 저장: ${csvPath}`);

// 상세 CSV도 생성
const detailedCSV = createDetailedCSV();
if (detailedCSV) {
    const detailPath = path.join(process.cwd(), `report_detailed_${new Date().toISOString().split('T')[0]}.csv`);
    fs.writeFileSync(detailPath, '\ufeff' + detailedCSV);
    console.log(`✅ CSV 상세 저장: ${detailPath}`);
}

console.log('\n📊 내보내기 완료!');
console.log('   CSV 파일을 Excel에서 열어보세요.');