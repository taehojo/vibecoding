const quizQuestions = [
    // 한국사 (13문제)
    {
        id: 1,
        category: "한국사",
        difficulty: "easy",
        question: "조선을 건국한 왕은 누구인가요?",
        options: ["이성계", "왕건", "이방원", "세종"],
        correctAnswer: 0,
        explanation: "이성계(태조)는 1392년 조선을 건국했습니다."
    },
    {
        id: 2,
        category: "한국사",
        difficulty: "medium",
        question: "한글을 창제한 왕은 누구인가요?",
        options: ["태조", "태종", "세종", "성종"],
        correctAnswer: 2,
        explanation: "세종대왕은 1443년(세종 25년) 한글을 창제하고 1446년에 반포했습니다."
    },
    {
        id: 3,
        category: "한국사",
        difficulty: "medium",
        question: "임진왜란이 일어난 연도는?",
        options: ["1392년", "1592년", "1636년", "1910년"],
        correctAnswer: 1,
        explanation: "임진왜란은 1592년(선조 25년)에 일본의 침략으로 시작되었습니다."
    },
    {
        id: 4,
        category: "한국사",
        difficulty: "hard",
        question: "고려의 수도는 어디였나요?",
        options: ["한양", "평양", "개경", "경주"],
        correctAnswer: 2,
        explanation: "고려의 수도는 개경(현재의 개성)이었습니다."
    },
    {
        id: 5,
        category: "한국사",
        difficulty: "medium",
        question: "3·1 운동이 일어난 연도는?",
        options: ["1910년", "1919년", "1945년", "1950년"],
        correctAnswer: 1,
        explanation: "3·1 운동은 1919년 3월 1일에 일어난 독립운동입니다."
    },
    {
        id: 6,
        category: "한국사",
        difficulty: "easy",
        question: "신라의 삼국통일을 완성한 왕은?",
        options: ["문무왕", "무열왕", "진흥왕", "법흥왕"],
        correctAnswer: 0,
        explanation: "문무왕은 676년 당나라 세력을 몰아내고 삼국통일을 완성했습니다."
    },
    {
        id: 7,
        category: "한국사",
        difficulty: "hard",
        question: "고구려를 건국한 인물은?",
        options: ["온조", "주몽", "박혁거세", "김수로"],
        correctAnswer: 1,
        explanation: "주몽(동명성왕)은 기원전 37년 고구려를 건국했습니다."
    },
    {
        id: 8,
        category: "한국사",
        difficulty: "medium",
        question: "조선시대 4대 사화 중 첫 번째는?",
        options: ["무오사화", "갑자사화", "기묘사화", "을사사화"],
        correctAnswer: 0,
        explanation: "무오사화(1498년)는 연산군 때 일어난 첫 번째 사화입니다."
    },
    {
        id: 9,
        category: "한국사",
        difficulty: "easy",
        question: "대한민국 정부 수립일은?",
        options: ["1945년 8월 15일", "1948년 8월 15일", "1950년 6월 25일", "1953년 7월 27일"],
        correctAnswer: 1,
        explanation: "대한민국 정부는 1948년 8월 15일에 수립되었습니다."
    },
    {
        id: 10,
        category: "한국사",
        difficulty: "medium",
        question: "조선시대 최고 교육기관은?",
        options: ["향교", "서원", "성균관", "서당"],
        correctAnswer: 2,
        explanation: "성균관은 조선시대 최고의 국립 교육기관이었습니다."
    },
    {
        id: 41,
        category: "한국사",
        difficulty: "medium",
        question: "고려 시대 무신정권의 최고 권력기구는?",
        options: ["중방", "정방", "도방", "삼별초"],
        correctAnswer: 0,
        explanation: "중방은 1170년 무신정변 이후 무신들이 국정을 논의하던 최고 권력기구였습니다."
    },
    {
        id: 42,
        category: "한국사",
        difficulty: "hard",
        question: "조선 후기 실학자 중 '북학의'를 저술한 인물은?",
        options: ["박지원", "박제가", "정약용", "이익"],
        correctAnswer: 1,
        explanation: "박제가는 18세기 후반 실학자로 '북학의(北學議)'를 저술하여 청나라의 선진 문물을 배울 것을 주장했습니다."
    },
    {
        id: 43,
        category: "한국사",
        difficulty: "hard",
        question: "대한민국 임시정부가 처음 수립된 장소는?",
        options: ["베이징", "난징", "충칭", "상하이"],
        correctAnswer: 3,
        explanation: "대한민국 임시정부는 1919년 4월 11일 중국 상하이에서 수립되었습니다. 이후 일제의 탄압을 피해 항저우, 충칭 등으로 이동했습니다."
    },
    {
        id: 44,
        category: "한국사",
        difficulty: "hard",
        question: "조선 후기 세도정치 시대의 '삼정의 문란'에 포함되지 않는 것은?",
        options: ["전정", "군정", "환곡", "공납"],
        correctAnswer: 3,
        explanation: "삼정의 문란은 전정(토지세), 군정(군역), 환곡(환곡제)의 폐단을 지칭합니다. 공납은 대동법으로 이미 개혁되었습니다."
    },

    // 세계지리 (10문제)
    {
        id: 11,
        category: "세계지리",
        difficulty: "easy",
        question: "세계에서 가장 큰 대륙은?",
        options: ["아프리카", "아시아", "북아메리카", "남극"],
        correctAnswer: 1,
        explanation: "아시아는 약 44,579,000km²로 세계에서 가장 큰 대륙입니다."
    },
    {
        id: 12,
        category: "세계지리",
        difficulty: "medium",
        question: "세계에서 가장 긴 강은?",
        options: ["아마존강", "나일강", "양쯔강", "미시시피강"],
        correctAnswer: 1,
        explanation: "나일강은 약 6,650km로 세계에서 가장 긴 강입니다."
    },
    {
        id: 13,
        category: "세계지리",
        difficulty: "easy",
        question: "일본의 수도는?",
        options: ["오사카", "교토", "도쿄", "요코하마"],
        correctAnswer: 2,
        explanation: "도쿄는 일본의 수도이자 최대 도시입니다."
    },
    {
        id: 14,
        category: "세계지리",
        difficulty: "hard",
        question: "세계에서 가장 깊은 해구는?",
        options: ["마리아나 해구", "통가 해구", "필리핀 해구", "푸에르토리코 해구"],
        correctAnswer: 0,
        explanation: "마리아나 해구의 챌린저 해연은 약 11,034m로 가장 깊습니다."
    },
    {
        id: 15,
        category: "세계지리",
        difficulty: "medium",
        question: "세계에서 가장 큰 사막은?",
        options: ["사하라 사막", "고비 사막", "남극 사막", "아라비아 사막"],
        correctAnswer: 2,
        explanation: "남극 대륙은 약 1,400만km²의 극지 사막으로 세계 최대입니다."
    },
    {
        id: 16,
        category: "세계지리",
        difficulty: "easy",
        question: "프랑스의 수도는?",
        options: ["런던", "베를린", "파리", "로마"],
        correctAnswer: 2,
        explanation: "파리는 프랑스의 수도이자 최대 도시입니다."
    },
    {
        id: 17,
        category: "세계지리",
        difficulty: "medium",
        question: "세계에서 가장 높은 산은?",
        options: ["K2", "에베레스트", "칸첸중가", "마칼루"],
        correctAnswer: 1,
        explanation: "에베레스트산은 해발 8,848.86m로 세계 최고봉입니다."
    },
    {
        id: 18,
        category: "세계지리",
        difficulty: "hard",
        question: "세계에서 가장 큰 호수는?",
        options: ["바이칼호", "슈피리어호", "카스피해", "빅토리아호"],
        correctAnswer: 2,
        explanation: "카스피해는 약 371,000km²로 세계 최대의 호수입니다."
    },
    {
        id: 19,
        category: "세계지리",
        difficulty: "easy",
        question: "이탈리아의 수도는?",
        options: ["밀라노", "베네치아", "로마", "나폴리"],
        correctAnswer: 2,
        explanation: "로마는 이탈리아의 수도입니다."
    },
    {
        id: 20,
        category: "세계지리",
        difficulty: "medium",
        question: "세계에서 가장 작은 나라는?",
        options: ["모나코", "바티칸", "산마리노", "리히텐슈타인"],
        correctAnswer: 1,
        explanation: "바티칸 시국은 약 0.44km²로 면적 기준 세계에서 가장 작은 나라입니다."
    },

    // 과학 (10문제)
    {
        id: 21,
        category: "과학",
        difficulty: "easy",
        question: "물의 화학식은?",
        options: ["H2O", "CO2", "O2", "H2O2"],
        correctAnswer: 0,
        explanation: "물은 수소 원자 2개와 산소 원자 1개로 이루어진 H2O입니다."
    },
    {
        id: 22,
        category: "과학",
        difficulty: "medium",
        question: "태양계에서 가장 큰 행성은?",
        options: ["토성", "목성", "천왕성", "해왕성"],
        correctAnswer: 1,
        explanation: "목성은 지름이 약 142,984km로 태양계 최대 행성입니다."
    },
    {
        id: 23,
        category: "과학",
        difficulty: "easy",
        question: "빛의 속도는 초속 약 몇 km인가요?",
        options: ["30만 km", "100만 km", "3만 km", "1000 km"],
        correctAnswer: 0,
        explanation: "빛의 속도는 진공에서 초속 약 299,792km입니다."
    },
    {
        id: 24,
        category: "과학",
        difficulty: "hard",
        question: "DNA의 이중나선 구조를 발견한 과학자는?",
        options: ["다윈", "아인슈타인", "왓슨과 크릭", "멘델"],
        correctAnswer: 2,
        explanation: "제임스 왓슨과 프랜시스 크릭은 1953년 DNA 이중나선 구조를 발견했습니다."
    },
    {
        id: 25,
        category: "과학",
        difficulty: "medium",
        question: "원자번호 1번 원소는?",
        options: ["헬륨", "수소", "리튬", "탄소"],
        correctAnswer: 1,
        explanation: "수소(H)는 원자번호 1번으로 가장 가벼운 원소입니다."
    },
    {
        id: 26,
        category: "과학",
        difficulty: "easy",
        question: "지구의 대기 중 가장 많은 기체는?",
        options: ["산소", "이산화탄소", "질소", "수소"],
        correctAnswer: 2,
        explanation: "질소는 대기의 약 78%를 차지합니다."
    },
    {
        id: 27,
        category: "과학",
        difficulty: "medium",
        question: "절대온도 0도는 섭씨 몇 도인가요?",
        options: ["-100°C", "-273.15°C", "-373°C", "0°C"],
        correctAnswer: 1,
        explanation: "절대영도는 -273.15°C로 이론상 도달 가능한 최저 온도입니다."
    },
    {
        id: 28,
        category: "과학",
        difficulty: "hard",
        question: "광합성에서 생성되는 주요 산물은?",
        options: ["이산화탄소와 물", "포도당과 산소", "질소와 수소", "메탄과 산소"],
        correctAnswer: 1,
        explanation: "광합성은 이산화탄소와 물을 이용해 포도당과 산소를 생성합니다."
    },
    {
        id: 29,
        category: "과학",
        difficulty: "easy",
        question: "인체에서 가장 큰 장기는?",
        options: ["심장", "간", "폐", "피부"],
        correctAnswer: 3,
        explanation: "피부는 인체에서 가장 큰 장기로 체중의 약 16%를 차지합니다."
    },
    {
        id: 30,
        category: "과학",
        difficulty: "medium",
        question: "상대성 이론을 발표한 과학자는?",
        options: ["뉴턴", "갈릴레이", "아인슈타인", "호킹"],
        correctAnswer: 2,
        explanation: "알베르트 아인슈타인은 1905년 특수상대성이론, 1915년 일반상대성이론을 발표했습니다."
    },

    // 예술과 문화 (10문제)
    {
        id: 31,
        category: "예술과 문화",
        difficulty: "easy",
        question: "'모나리자'를 그린 화가는?",
        options: ["피카소", "고흐", "다빈치", "미켈란젤로"],
        correctAnswer: 2,
        explanation: "레오나르도 다빈치는 1503-1519년경 모나리자를 그렸습니다."
    },
    {
        id: 32,
        category: "예술과 문화",
        difficulty: "medium",
        question: "베토벤의 교향곡은 총 몇 개인가요?",
        options: ["5개", "7개", "9개", "12개"],
        correctAnswer: 2,
        explanation: "루트비히 판 베토벤은 총 9개의 교향곡을 작곡했습니다."
    },
    {
        id: 33,
        category: "예술과 문화",
        difficulty: "easy",
        question: "'해바라기' 연작으로 유명한 화가는?",
        options: ["모네", "고흐", "르누아르", "세잔"],
        correctAnswer: 1,
        explanation: "빈센트 반 고흐는 1888-1889년 해바라기 연작을 그렸습니다."
    },
    {
        id: 34,
        category: "예술과 문화",
        difficulty: "hard",
        question: "'게르니카'를 그린 화가는?",
        options: ["달리", "피카소", "미로", "고야"],
        correctAnswer: 1,
        explanation: "파블로 피카소는 1937년 스페인 내전을 주제로 게르니카를 그렸습니다."
    },
    {
        id: 35,
        category: "예술과 문화",
        difficulty: "medium",
        question: "'로미오와 줄리엣'의 작가는?",
        options: ["괴테", "셰익스피어", "단테", "호메로스"],
        correctAnswer: 1,
        explanation: "윌리엄 셰익스피어는 1595년경 로미오와 줄리엣을 집필했습니다."
    },
    {
        id: 36,
        category: "예술과 문화",
        difficulty: "easy",
        question: "피아노의 건반 수는 일반적으로 몇 개인가요?",
        options: ["52개", "66개", "88개", "100개"],
        correctAnswer: 2,
        explanation: "현대 피아노는 일반적으로 88개의 건반(52개 백건, 36개 흑건)을 가지고 있습니다."
    },
    {
        id: 37,
        category: "예술과 문화",
        difficulty: "medium",
        question: "'생각하는 사람' 조각의 작가는?",
        options: ["로댕", "미켈란젤로", "베르니니", "도나텔로"],
        correctAnswer: 0,
        explanation: "오귀스트 로댕은 1902년 '생각하는 사람'을 완성했습니다."
    },
    {
        id: 38,
        category: "예술과 문화",
        difficulty: "hard",
        question: "인상주의 화파의 이름은 어느 작품에서 유래했나요?",
        options: ["수련", "인상, 해돋이", "물랭 루즈", "별이 빛나는 밤"],
        correctAnswer: 1,
        explanation: "클로드 모네의 '인상, 해돋이(1872)'에서 인상주의라는 이름이 유래했습니다."
    },
    {
        id: 39,
        category: "예술과 문화",
        difficulty: "easy",
        question: "한국의 전통 음악을 무엇이라 하나요?",
        options: ["가요", "국악", "민요", "판소리"],
        correctAnswer: 1,
        explanation: "국악은 한국의 전통 음악을 총칭하는 말입니다."
    },
    {
        id: 40,
        category: "예술과 문화",
        difficulty: "medium",
        question: "'돈키호테'의 작가는?",
        options: ["세르반테스", "톨스토이", "도스토예프스키", "발자크"],
        correctAnswer: 0,
        explanation: "미겔 데 세르반테스는 1605년과 1615년 돈키호테를 출간했습니다."
    }
,
    {
        id: 45,
        category: "한국사",
        difficulty: "hard",
        question: "조선시대 4대 사화 중 가장 마지막에 일어난 것은?",
        options: ["무오사화","갑자사화","기묘사화","을사사화"],
        correctAnswer: 3,
        explanation: "을사사화(1545년)는 명종 때 일어난 마지막 사화입니다."
    },
    {
        id: 46,
        category: "세계지리",
        difficulty: "medium",
        question: "아프리카 대륙에서 면적이 가장 큰 국가는?",
        options: ["나이지리아","남아프리카공화국","알제리","이집트"],
        correctAnswer: 2,
        explanation: "알제리는 약 238만km²로 아프리카에서 가장 큰 국가입니다."
    },
    {
        id: 47,
        category: "과학",
        difficulty: "easy",
        question: "광합성에 필요한 기체는?",
        options: ["산소","이산화탄소","질소","수소"],
        correctAnswer: 1,
        explanation: "식물은 이산화탄소와 물, 빛을 이용해 광합성을 합니다."
    },
    {
        id: 48,
        category: "예술과 문화",
        difficulty: "medium",
        question: "레오나르도 다빈치의 '최후의 만찬'이 그려진 도시는?",
        options: ["로마","피렌체","밀라노","베네치아"],
        correctAnswer: 2,
        explanation: "최후의 만찬은 밀라노의 산타 마리아 델레 그라치에 수도원에 있습니다."
    }];
