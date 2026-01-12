# RRWeb SDK UI Debug

RRWeb SDK의 UI 컴포넌트를 시각적으로 테스트하고 디버그하기 위한 개발 전용 앱입니다.

## 실행 방법

### 단독 실행

```bash
cd apps/rrweb-sdk-ui-debug
pnpm dev
```

## 기능

### 1. Full SDK 테스트 모드

- 실제 SDK를 초기화하고 전체 기능 테스트
- 녹화 시작/중지 버튼
- 우측 하단 플로팅 버튼과 설정 패널

### 2. 컴포넌트 개별 테스트 모드

- `FloatingButton`: 녹화 상태 토글하여 UI 변화 확인
- `SettingsPanel`: 패널 열기/닫기, 상태 업데이트 테스트
- `UIManager`: 전체 UI 시스템 테스트

### 3. 테스트용 인터랙티브 요소

- 버튼, 입력창, 셀렉트 등 녹화 테스트용 요소들

## 의존성

이 앱은 `@repo/rrweb-sdk-4` 패키지를 workspace 의존성으로 사용합니다.
SDK를 수정하면 자동으로 반영됩니다.

## 포트

- 개발 서버: http://localhost:4999
