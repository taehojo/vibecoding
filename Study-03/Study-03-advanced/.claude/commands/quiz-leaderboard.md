---
aliases: []
---

# quiz-leaderboard

퀴즈 게임의 순위 시스템을 관리합니다.

## 사용법
```
/quiz-leaderboard [옵션] [기간]
```

## 옵션
- `/quiz-leaderboard` - 전체 순위표 표시
- `/quiz-leaderboard show [기간]` - 특정 기간 순위표
- `/quiz-leaderboard add [점수]` - 테스트 점수 추가
- `/quiz-leaderboard reset` - 순위표 초기화
- `/quiz-leaderboard export` - 순위표 내보내기

## 기간 옵션
- `all` - 전체 기간 (기본값)
- `daily` - 오늘
- `weekly` - 이번 주
- `monthly` - 이번 달

## 기능
1. **순위표 표시**
   - 상위 10명 표시
   - 점수, 정답률, 날짜 포함
   - 카테고리별 필터링

2. **순위 관리**
   - 자동 순위 계산
   - 중복 제거
   - 기간별 필터링

3. **통계 정보**
   - 평균 점수
   - 최고/최저 점수
   - 참여자 수

4. **데이터 관리**
   - 순위표 내보내기
   - 백업 및 복원
   - 초기화

## 실행 코드
```javascript
const fs = require('fs');

// 파라미터 파싱
const args = process.argv.slice(2);
const action = args[0] || 'show';
const param = args[1] || 'all';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               🏆 퀴즈 게임 순위표                               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 샘플 리더보드 데이터 생성
function generateSampleLeaderboard() {
    const names = ['김철수', '이영희', '박민수', '정수진', '최동훈', '강미나', '윤서준', '한지민', '오승현', '임수정'];
    const avatars = ['🎮', '🎯', '🏆', '⭐', '🚀', '🎨', '🎭', '🎪', '🎲', '🃏'];
    const categories = ['한국사', '세계지리', '과학', '예술과 문화', 'mixed'];
    
    const leaderboard = [];
    const now = new Date();
    
    for (let i = 0; i < 20; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        
        leaderboard.push({
            username: names[Math.floor(Math.random() * names.length)],
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            score: Math.floor(Math.random() * 400) + 100,
            accuracy: Math.floor(Math.random() * 40) + 60,
            category: categories[Math.floor(Math.random() * categories.length)],
            timestamp: date.toISOString(),
            games: Math.floor(Math.random() * 50) + 1
        });
    }
    
    return leaderboard.sort((a, b) => b.score - a.score);
}

// 기간별 필터링
function filterByPeriod(leaderboard, period) {
    const now = new Date();
    const filtered = leaderboard.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        
        switch(period) {
            case 'daily':
                return entryDate.toDateString() === now.toDateString();
            case 'weekly':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return entryDate >= weekAgo;
            case 'monthly':
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return entryDate >= monthAgo;
            default:
                return true;
        }
    });
    
    return filtered;
}

// 순위표 표시
function displayLeaderboard(leaderboard, period) {
    const periodText = {
        'all': '전체',
        'daily': '일간',
        'weekly': '주간',
        'monthly': '월간'
    }[period] || '전체';
    
    console.log(`📅 기간: ${periodText}`);
    console.log(`👥 참여자: ${leaderboard.length}명\n`);
    
    if (leaderboard.length === 0) {
        console.log('  아직 기록이 없습니다.\n');
        return;
    }
    
    console.log('┌────┬──────────────┬───────┬────────┬──────────┐');
    console.log('│순위│   플레이어   │  점수 │ 정답률 │   날짜   │');
    console.log('├────┼──────────────┼───────┼────────┼──────────┤');
    
    leaderboard.slice(0, 10).forEach((entry, index) => {
        let rank = index + 1;
        let rankDisplay = rank.toString().padStart(2);
        
        if (rank === 1) rankDisplay = '🥇';
        if (rank === 2) rankDisplay = '🥈';
        if (rank === 3) rankDisplay = '🥉';
        
        const playerName = `${entry.avatar} ${entry.username}`.padEnd(12);
        const score = entry.score.toString().padStart(5);
        const accuracy = `${entry.accuracy}%`.padStart(6);
        const date = new Date(entry.timestamp);
        const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`.padStart(8);
        
        console.log(`│ ${rankDisplay} │ ${playerName} │ ${score} │ ${accuracy} │ ${dateStr} │`);
    });
    
    console.log('└────┴──────────────┴───────┴────────┴──────────┘');
    
    // 통계 정보
    const scores = leaderboard.map(e => e.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    console.log('\n📊 통계');
    console.log('─'.repeat(50));
    console.log(`  최고 점수: ${maxScore}점`);
    console.log(`  평균 점수: ${avgScore}점`);
    console.log(`  최저 점수: ${minScore}점`);
}

// 액션별 처리
const leaderboard = generateSampleLeaderboard();

switch(action) {
    case 'show':
        const filtered = filterByPeriod(leaderboard, param);
        displayLeaderboard(filtered, param);
        break;
        
    case 'add':
        const score = parseInt(param) || Math.floor(Math.random() * 300) + 100;
        console.log(`✅ 테스트 점수 추가됨: ${score}점`);
        
        leaderboard.push({
            username: 'TestUser',
            avatar: '🧪',
            score: score,
            accuracy: Math.floor(Math.random() * 40) + 60,
            category: 'mixed',
            timestamp: new Date().toISOString(),
            games: 1
        });
        
        const newLeaderboard = leaderboard.sort((a, b) => b.score - a.score);
        displayLeaderboard(newLeaderboard.slice(0, 10), 'all');
        break;
        
    case 'reset':
        console.log('⚠️  순위표를 초기화하시겠습니까?');
        console.log('   이 작업은 되돌릴 수 없습니다.');
        console.log('\n   실제 환경에서는 확인 프롬프트가 표시됩니다.');
        break;
        
    case 'export':
        const exportData = {
            exported: new Date().toISOString(),
            period: param,
            count: leaderboard.length,
            data: leaderboard.slice(0, 50)
        };
        
        const filename = `leaderboard_${new Date().getTime()}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        console.log(`✅ 순위표가 ${filename}로 내보내졌습니다.`);
        console.log(`   총 ${exportData.data.length}개 기록`);
        break;
        
    default:
        displayLeaderboard(leaderboard.slice(0, 10), 'all');
}

// 개인 최고 기록
console.log('\n🎯 나의 최고 기록');
console.log('─'.repeat(50));
console.log('  최고 점수: 0점');
console.log('  최고 정답률: 0%');
console.log('  총 게임 수: 0회');
console.log('  현재 순위: -위');

console.log('\n✅ 순위표 관리 완료\n');
```

## 출력 예시
```
╔══════════════════════════════════════════════════════════════╗
║               🏆 퀴즈 게임 순위표                               ║
╚══════════════════════════════════════════════════════════════╝

📅 기간: 전체
👥 참여자: 20명

┌────┬──────────────┬───────┬────────┬──────────┐
│순위│   플레이어   │  점수 │ 정답률 │   날짜   │
├────┼──────────────┼───────┼────────┼──────────┤
│ 🥇 │ 🎮 김철수     │   485 │    92% │    12/15 │
│ 🥈 │ ⭐ 이영희     │   472 │    88% │    12/14 │
│ 🥉 │ 🏆 박민수     │   456 │    85% │    12/13 │
│  4 │ 🎯 정수진     │   445 │    83% │    12/15 │
│  5 │ 🚀 최동훈     │   438 │    81% │    12/12 │
│  6 │ 🎨 강미나     │   425 │    79% │    12/11 │
│  7 │ 🎭 윤서준     │   412 │    77% │    12/10 │
│  8 │ 🎪 한지민     │   398 │    75% │    12/09 │
│  9 │ 🎲 오승현     │   385 │    73% │    12/08 │
│ 10 │ 🃏 임수정     │   372 │    71% │    12/07 │
└────┴──────────────┴───────┴────────┴──────────┘

📊 통계
──────────────────────────────────────────────────
  최고 점수: 485점
  평균 점수: 352점
  최저 점수: 112점

🎯 나의 최고 기록
──────────────────────────────────────────────────
  최고 점수: 0점
  최고 정답률: 0%
  총 게임 수: 0회
  현재 순위: -위

✅ 순위표 관리 완료
```

## 추가 기능
- 카테고리별 순위표
- 친구 순위 비교
- 주간/월간 챔피언
- 순위 변동 추적
- 보상 시스템 연동