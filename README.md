# 🎨 문센뭐하지 (munsen-mwohani)

> **우리 동네 문화센터, 뭐 하지?**
> 지역 문화센터 프로그램을 쉽고 빠르게 찾아주는 추천 서비스

🌐 **[서비스 바로가기](https://munsen-mwohani.vercel.app)**

---

## 📌 프로젝트 소개

문화센터 프로그램 정보가 여러 곳에 흩어져 있어 찾기 불편하다는 문제를 해결하기 위해 만든 서비스입니다.
지역과 관심사를 기반으로 문화센터 프로그램을 한눈에 확인할 수 있습니다.

---

## 🛠 기술 스택

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat-square&logo=css3&logoColor=white)

### Backend
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)

### Infra
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)

---

## 🏗 프로젝트 구조

```
munsen-mwohani/
├── frontend/       # Next.js + TypeScript
├── backend/        # Python 백엔드 API
├── data/           # 문화센터 데이터
├── tools/          # 데이터 수집/가공 툴
└── workflows/      # 자동화 워크플로우
```

---

## ✨ 주요 기능

- 📍 **지역별 검색** — 동네 기반으로 문화센터 프로그램 탐색
- 🔍 **프로그램 필터링** — 카테고리, 대상, 요일별 필터
- 📱 **반응형 UI** — 모바일/PC 모두 최적화된 화면 제공

---

## 🚀 개발 배경

> "우리 아이랑 주말에 뭐 하지?" 라는 질문에서 시작했습니다.

문화센터 프로그램 정보를 찾으려면 각 센터 홈페이지를 일일이 방문해야 하는 불편함이 있었습니다.
이를 해결하기 위해 데이터를 수집·가공하여 한 곳에서 검색할 수 있는 서비스를 기획하고 직접 개발했습니다.

---

## 💡 기술적 도전

- **Claude Code(AI)를 활용한 개발** — AI 코딩 툴을 적극 활용하여 기획부터 배포까지 단독 수행
- **Python 데이터 파이프라인 구축** — 문화센터 데이터 수집 및 가공 자동화
- **Vercel + Railway 조합** — 프론트엔드와 백엔드를 각각 최적의 플랫폼에 배포

---

## 📈 향후 계획

- [ ] AI 챗봇 추가 — "6살 딸이랑 주말에 뭔가 하고 싶어요" 자연어 입력으로 프로그램 추천
- [ ] 접수 시작일 알림 기능
- [ ] 데이터 범위 확장 (현재 데이터 검증 중)
