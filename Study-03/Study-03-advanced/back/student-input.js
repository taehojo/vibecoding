#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 파일 경로
const rosterPath = path.join(process.cwd(), 'student_roster.json');
const dataPath = path.join(process.cwd(), 'student_data.json');

// readline 인터페이스 생성
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// 학생 명단 로드
function loadRoster() {
    if (fs.existsSync(rosterPath)) {
        return JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
    }
    return [];
}

// 학생 명단 저장
function saveRoster(roster) {
    fs.writeFileSync(rosterPath, JSON.stringify(roster, null, 2));
}

// 학생 데이터 저장
function saveStudentData(roster) {
    const studentData = roster.map(student => ({
        ...student,
        averageScore: 0,
        grade: 'N/A',
        quizHistory: []
    }));
    fs.writeFileSync(dataPath, JSON.stringify(studentData, null, 2));
}

// 질문 함수
function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, answer => {
            resolve(answer);
        });
    });
}

// 메인 메뉴 표시
function showMainMenu() {
    console.log('\n' + colors.cyan + '📚 학생 정보 입력 시스템' + colors.reset);
    console.log('=' .repeat(30));
    console.log('1. 새 학생 추가');
    console.log('2. 기존 학생 목록 보기');
    console.log('3. 학생 정보 수정');
    console.log('4. 학생 삭제');
    console.log('5. 전체 초기화');
    console.log('0. 저장 후 종료');
    console.log('=' .repeat(30));
}

// 새 학생 추가
async function addStudent(roster) {
    console.log('\n' + colors.yellow + '📝 새 학생 추가' + colors.reset);
    
    const name = await question('학생 이름: ');
    if (!name.trim()) {
        console.log(colors.red + '❌ 이름을 입력해주세요.' + colors.reset);
        return roster;
    }
    
    const classNum = await question('반 번호 (1-10): ');
    if (!classNum || classNum < 1 || classNum > 10) {
        console.log(colors.red + '❌ 올바른 반 번호를 입력해주세요 (1-10).' + colors.reset);
        return roster;
    }
    
    const studentId = await question('학번 (4자리): ');
    if (!studentId || studentId.length !== 4 || isNaN(studentId)) {
        console.log(colors.red + '❌ 4자리 학번을 입력해주세요.' + colors.reset);
        return roster;
    }
    
    // 중복 확인
    if (roster.some(s => s.studentId === studentId)) {
        console.log(colors.red + '❌ 이미 존재하는 학번입니다.' + colors.reset);
        return roster;
    }
    
    // 동명이인 확인
    if (roster.some(s => s.name === name)) {
        const confirm = await question(colors.yellow + '⚠️ 동일한 이름이 존재합니다. 계속하시겠습니까? (y/n): ' + colors.reset);
        if (confirm.toLowerCase() !== 'y') {
            return roster;
        }
    }
    
    // 새 학생 추가
    const newStudent = {
        id: `STU${String(roster.length + 1).padStart(3, '0')}`,
        studentId: studentId,
        name: name.trim(),
        class: `${classNum}반`,
        addedDate: new Date().toISOString().split('T')[0]
    };
    
    roster.push(newStudent);
    console.log(colors.green + `✅ ${name}(${classNum}반, ${studentId}) 학생이 추가되었습니다.` + colors.reset);
    
    return roster;
}

// 학생 목록 보기
function showStudentList(roster) {
    if (roster.length === 0) {
        console.log(colors.yellow + '\n⚠️ 등록된 학생이 없습니다.' + colors.reset);
        return;
    }
    
    console.log('\n' + colors.cyan + '📋 학생 목록' + colors.reset);
    console.log('─'.repeat(60));
    console.log('번호 | 학번   | 이름       | 반    | 등록일');
    console.log('─'.repeat(60));
    
    roster.forEach((student, index) => {
        console.log(
            `${String(index + 1).padStart(3)} | ` +
            `${student.studentId} | ` +
            `${student.name.padEnd(10)} | ` +
            `${student.class.padEnd(5)} | ` +
            `${student.addedDate}`
        );
    });
    console.log('─'.repeat(60));
    console.log(`총 ${roster.length}명`);
}

// 학생 정보 수정
async function editStudent(roster) {
    if (roster.length === 0) {
        console.log(colors.yellow + '\n⚠️ 등록된 학생이 없습니다.' + colors.reset);
        return roster;
    }
    
    showStudentList(roster);
    
    const index = await question('\n수정할 학생 번호: ');
    const studentIndex = parseInt(index) - 1;
    
    if (studentIndex < 0 || studentIndex >= roster.length) {
        console.log(colors.red + '❌ 잘못된 번호입니다.' + colors.reset);
        return roster;
    }
    
    const student = roster[studentIndex];
    console.log(`\n현재: ${student.name} (${student.class}, ${student.studentId})`);
    
    const newName = await question('새 이름 (엔터: 변경 없음): ');
    const newClass = await question('새 반 번호 (엔터: 변경 없음): ');
    
    if (newName.trim()) {
        student.name = newName.trim();
    }
    if (newClass && newClass >= 1 && newClass <= 10) {
        student.class = `${newClass}반`;
    }
    
    console.log(colors.green + '✅ 학생 정보가 수정되었습니다.' + colors.reset);
    return roster;
}

// 학생 삭제
async function deleteStudent(roster) {
    if (roster.length === 0) {
        console.log(colors.yellow + '\n⚠️ 등록된 학생이 없습니다.' + colors.reset);
        return roster;
    }
    
    showStudentList(roster);
    
    const index = await question('\n삭제할 학생 번호: ');
    const studentIndex = parseInt(index) - 1;
    
    if (studentIndex < 0 || studentIndex >= roster.length) {
        console.log(colors.red + '❌ 잘못된 번호입니다.' + colors.reset);
        return roster;
    }
    
    const student = roster[studentIndex];
    const confirm = await question(colors.yellow + `정말 ${student.name} 학생을 삭제하시겠습니까? (y/n): ` + colors.reset);
    
    if (confirm.toLowerCase() === 'y') {
        roster.splice(studentIndex, 1);
        // ID 재정렬
        roster.forEach((s, i) => {
            s.id = `STU${String(i + 1).padStart(3, '0')}`;
        });
        console.log(colors.green + '✅ 학생이 삭제되었습니다.' + colors.reset);
    }
    
    return roster;
}

// 전체 초기화
async function resetAll() {
    const confirm = await question(colors.red + '⚠️ 모든 데이터가 삭제됩니다. 계속하시겠습니까? (yes 입력): ' + colors.reset);
    
    if (confirm === 'yes') {
        if (fs.existsSync(rosterPath)) fs.unlinkSync(rosterPath);
        if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
        console.log(colors.green + '✅ 모든 데이터가 초기화되었습니다.' + colors.reset);
        return [];
    }
    
    console.log('초기화가 취소되었습니다.');
    return null;
}

// 메인 실행 함수
async function main() {
    let roster = loadRoster();
    const args = process.argv.slice(2);
    
    // 명령줄 옵션 처리
    if (args.includes('--demo')) {
        console.log(colors.yellow + '⚠️ 데모 모드: student-data-generator.js를 실행하세요.' + colors.reset);
        rl.close();
        return;
    }
    
    if (args.includes('--load')) {
        console.log(colors.cyan + `📂 기존 학생 명단 로드: ${roster.length}명` + colors.reset);
        showStudentList(roster);
    }
    
    // 메인 루프
    let running = true;
    while (running) {
        showMainMenu();
        const choice = await question('\n선택: ');
        
        switch (choice) {
            case '1':
                roster = await addStudent(roster);
                break;
            case '2':
                showStudentList(roster);
                break;
            case '3':
                roster = await editStudent(roster);
                break;
            case '4':
                roster = await deleteStudent(roster);
                break;
            case '5':
                const resetResult = await resetAll();
                if (resetResult !== null) {
                    roster = resetResult;
                }
                break;
            case '0':
                saveRoster(roster);
                saveStudentData(roster);
                console.log(colors.green + '\n✅ 데이터가 저장되었습니다.' + colors.reset);
                console.log(`  • ${rosterPath}`);
                console.log(`  • ${dataPath}`);
                running = false;
                break;
            default:
                console.log(colors.red + '❌ 잘못된 선택입니다.' + colors.reset);
        }
    }
    
    rl.close();
    console.log(colors.cyan + '\n👋 프로그램을 종료합니다.' + colors.reset);
}

// 에러 처리
process.on('SIGINT', () => {
    console.log(colors.yellow + '\n\n⚠️ 프로그램이 중단되었습니다.' + colors.reset);
    rl.close();
    process.exit(0);
});

// 실행
if (require.main === module) {
    console.log(colors.bright + colors.blue + '\n🎓 학생 정보 관리 시스템 v1.0' + colors.reset);
    console.log(colors.cyan + '실제 학생 정보를 입력하고 관리합니다.\n' + colors.reset);
    main().catch(err => {
        console.error(colors.red + '오류 발생:', err.message + colors.reset);
        rl.close();
        process.exit(1);
    });
}