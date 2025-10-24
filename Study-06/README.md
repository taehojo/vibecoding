# 쇼핑 리스트 앱

8장에서 만든 Supabase 연동 쇼핑 리스트 애플리케이션입니다.

## 기능

- 쇼핑 아이템 추가/삭제
- 구매 완료 체크
- Supabase 데이터베이스와 실시간 동기화
- 여러 기기에서 동일한 데이터 공유

## Vercel 배포 설정

Vercel에 배포하려면 다음 환경 변수를 설정해야 합니다:

### 필수 환경 변수

1. Vercel 대시보드에서 프로젝트 설정으로 이동
2. Settings > Environment Variables 메뉴 선택
3. 다음 변수들을 추가:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase 자격 증명 얻기

1. [Supabase](https://supabase.com)에 로그인
2. 프로젝트 선택
3. Settings > API 메뉴에서 다음 정보 확인:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** 키 → `SUPABASE_ANON_KEY`

### 데이터베이스 테이블 생성

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
CREATE TABLE shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) 활성화
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON shopping_items
  FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능
CREATE POLICY "Enable insert access for all users" ON shopping_items
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트 가능
CREATE POLICY "Enable update access for all users" ON shopping_items
  FOR UPDATE USING (true);

-- 모든 사용자가 삭제 가능
CREATE POLICY "Enable delete access for all users" ON shopping_items
  FOR DELETE USING (true);
```

## 로컬 개발

로컬에서 테스트하려면:

1. `.env.local` 파일 생성:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Vercel CLI로 실행:
```bash
vercel dev
```

## 기술 스택

- HTML/CSS/JavaScript
- Supabase (PostgreSQL 데이터베이스)
- Vercel (서버리스 함수 및 호스팅)
