#!/usr/bin/env node

/**
 * 교사 모드 통합 실행 스크립트
 * 모든 교사 모드 명령어를 순차적으로 실행
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 콘솔 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// 헤더 출력
function printHeader() {
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + colors.blue + '                    🎓 교사 모드 실행' + colors.reset);
    console.log(colors.cyan + '                  Teacher Mode Execution' + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

// 단계 실행
function executeStep(stepNumber, totalSteps, name, command, description) {
    console.log(colors.yellow + `\n[${stepNumber}/${totalSteps}] ${name}` + colors.reset);
    console.log(colors.cyan + `📝 ${description}` + colors.reset);
    console.log('─'.repeat(60));
    
    const startTime = Date.now();
    
    try {
        execSync(command, { stdio: 'inherit' });
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(colors.green + `\n✅ ${name} 완료 (${executionTime}초)` + colors.reset);
        return { success: true, time: executionTime };
    } catch (error) {
        console.error(colors.red + `\n❌ ${name} 실패: ${error.message}` + colors.reset);
        return { success: false, error: error.message };
    }
}

// 메인 실행
function main() {
    printHeader();
    
    const steps = [
        {
            name: '학생 데이터 생성',
            command: 'node student-data-generator.js',
            description: '20명의 가상 학생 퀴즈 데이터를 생성합니다'
        },
        {
            name: '성적 분석',
            command: 'node grade-analyzer.js',
            description: '전체 학생의 성적을 종합 분석합니다'
        },
        {
            name: '학생 비교',
            command: 'node student-comparison.js',
            description: '상위/하위 학생을 비교 분석합니다'
        },
        {
            name: 'HTML 보고서 생성',
            command: 'node teacher-report.js',
            description: '시각적 HTML 보고서를 생성합니다'
        }
    ];
    
    const results = [];
    let successCount = 0;
    
    // 각 단계 실행
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const result = executeStep(i + 1, steps.length, step.name, step.command, step.description);
        
        results.push({
            name: step.name,
            ...result
        });
        
        if (result.success) {
            successCount++;
        } else if (i === 0) {
            // 첫 단계 실패 시 중단
            console.log(colors.red + '\n⚠️ 데이터 생성 실패로 작업을 중단합니다.' + colors.reset);
            break;
        }
    }
    
    // 결과 요약
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + '                   📊 실행 결과 요약' + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
    
    // 각 단계 결과
    console.log(colors.yellow + '🔸 단계별 실행 결과:' + colors.reset);
    results.forEach((result, index) => {
        const status = result.success 
            ? colors.green + '✅ 성공' + colors.reset 
            : colors.red + '❌ 실패' + colors.reset;
        const time = result.time ? ` (${result.time}초)` : '';
        console.log(`  ${index + 1}. ${result.name}: ${status}${time}`);
    });
    
    // 완료율
    const completionRate = Math.round(successCount / steps.length * 100);
    console.log(colors.yellow + `\n🔸 완료율: ${successCount}/${steps.length} (${completionRate}%)` + colors.reset);
    
    // 생성된 파일 확인
    console.log(colors.yellow + '\n🔸 생성된 파일:' + colors.reset);
    const files = [
        'student_data.json',
        `teacher_report_${new Date().toISOString().split('T')[0]}.html`
    ];
    
    files.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(2);
            console.log(colors.green + `  ✅ ${file} (${size} KB)` + colors.reset);
        } else {
            console.log(colors.yellow + `  ⚠️ ${file} (생성되지 않음)` + colors.reset);
        }
    });
    
    // 완료 메시지
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    
    if (successCount === steps.length) {
        console.log(colors.green + colors.bright + '✨ 교사 모드 실행이 완료되었습니다!' + colors.reset);
        console.log(colors.cyan + '\n다음 작업을 수행할 수 있습니다:' + colors.reset);
        console.log('  1. HTML 보고서를 브라우저에서 열어 확인');
        console.log('  2. student_data.json으로 추가 분석');
        console.log('  3. 개별 명령어로 상세 분석');
    } else {
        console.log(colors.yellow + '⚠️ 일부 작업이 완료되지 않았습니다.' + colors.reset);
        console.log(colors.cyan + '\n문제 해결 방법:' + colors.reset);
        console.log('  1. 오류 메시지 확인');
        console.log('  2. 개별 스크립트 직접 실행');
        console.log('  3. run-teacher-mode.js 재실행');
    }
    
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

// 스크립트 실행
if (require.main === module) {
    main();
}