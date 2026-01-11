# rrweb vs rrweb-snapshot 비교 분석

## 📋 개요

스냅샷만 기록하는 프로그램을 만들 때 `rrweb`과 `rrweb-snapshot` 중 어떤 것을 사용할지 비교 분석한 문서입니다.

## 🔍 현재 상황

- **목표**: 스냅샷만 기록 (플레이어는 다른 프로젝트에서 구현)
- **현재 사용**: `rrweb` 패키지의 `record()` 함수

## 📦 패키지 구조

### rrweb 패키지

- `rrweb`은 `rrweb-snapshot`을 **의존성으로 포함**하고 있습니다
- `rrweb` 설치 시 `rrweb-snapshot`도 자동으로 설치됩니다
- `package.json`에서 확인:
  ```json
  "dependencies": {
    "@rrweb/types": "^2.0.0-alpha.4",
    "rrweb-snapshot": "^2.0.0-alpha.4"
  }
  ```

## ⚖️ 비교 분석

### 1. 번들 크기

| 항목                  | rrweb   | rrweb-snapshot만 |
| --------------------- | ------- | ---------------- |
| **전체 패키지**       | ~500KB+ | ~100KB (추정)    |
| **이벤트 리스너**     | 포함    | 제외             |
| **Mutation Observer** | 포함    | 제외             |
| **스냅샷 생성**       | 포함    | 포함             |

**결론**: `rrweb-snapshot`만 사용하면 **번들 크기가 약 80% 감소**할 수 있습니다.

### 2. 메모리 사용량

| 항목                 | rrweb     | rrweb-snapshot만 |
| -------------------- | --------- | ---------------- |
| **이벤트 추적**      | 지속적    | 없음             |
| **DOM 리스너**       | 다수 등록 | 없음             |
| **메모리 누수 위험** | 높음      | 낮음             |

**결론**: 스냅샷만 필요한 경우 `rrweb-snapshot`이 **메모리 효율적**입니다.

### 3. 성능

| 항목                 | rrweb  | rrweb-snapshot만 |
| -------------------- | ------ | ---------------- |
| **DOM 변경 감지**    | 지속적 | 없음             |
| **CPU 사용량**       | 높음   | 낮음             |
| **스냅샷 생성 속도** | 동일   | 동일             |

**결론**: `rrweb-snapshot`만 사용하면 **런타임 오버헤드가 없습니다**.

### 4. 사용 편의성

| 항목           | rrweb             | rrweb-snapshot만 |
| -------------- | ----------------- | ---------------- |
| **API 복잡도** | 낮음 (`record()`) | 중간 (직접 구현) |
| **문서/예제**  | 풍부              | 제한적           |
| **유지보수**   | 쉬움              | 직접 관리        |

**결론**: `rrweb`이 **사용하기 더 쉽습니다**.

## 💡 권장 사항

### ✅ rrweb-snapshot만 사용하는 것이 유리한 경우

1. **번들 크기가 중요한 경우** (모바일 앱, 번들 크기 제한)
2. **스냅샷만 필요하고 이벤트는 전혀 필요 없는 경우**
3. **메모리 사용량을 최소화해야 하는 경우**
4. **성능이 중요한 경우** (DOM 리스너 오버헤드 제거)

### ✅ rrweb을 사용하는 것이 유리한 경우

1. **개발 편의성이 중요한 경우**
2. **나중에 이벤트 기록도 필요할 수 있는 경우**
3. **문서와 예제가 풍부한 것이 중요한 경우**
4. **번들 크기가 큰 문제가 아닌 경우**

## 🛠️ 구현 방법

### 방법 1: rrweb 사용 (현재 방식)

```typescript
import { record } from "rrweb";

// 스냅샷만 생성하고 즉시 중지
const stopRecording = record({
  emit: (event) => {
    if (event.type === EventType.FullSnapshot) {
      // 스냅샷만 저장
    }
  },
});

record.takeFullSnapshot();
stopRecording(); // 즉시 중지
```

**장점**:

- 간단한 API
- 잘 문서화됨
- 타입 지원 완벽

**단점**:

- 전체 `rrweb` 패키지 포함
- 이벤트 리스너가 잠깐이라도 등록됨

### 방법 2: rrweb-snapshot 직접 사용

```bash
# 별도 설치 필요
pnpm add rrweb-snapshot@2.0.0-alpha.4 @rrweb/types@2.0.0-alpha.4
```

```typescript
import { snapshot } from "rrweb-snapshot";
import type { serializedNodeWithId } from "rrweb-snapshot";
import { EventType } from "@rrweb/types";

// 스냅샷 직접 생성
const snapshotData = snapshot(document, {
  maskAllInputs: false,
  maskTextClass: "mask",
});

// eventWithTime 형식으로 변환
const fullSnapshotEvent = {
  type: EventType.FullSnapshot,
  data: snapshotData,
  timestamp: Date.now(),
};
```

**장점**:

- 번들 크기 최소화
- 메모리 효율적
- 성능 오버헤드 없음

**단점**:

- 별도 패키지 설치 필요
- 직접 구현 필요
- 문서가 제한적

## 📊 실제 측정 (권장)

다음 명령어로 번들 크기를 비교해보세요:

```bash
# rrweb 사용 시
pnpm build
# dist 폴더 크기 확인

# rrweb-snapshot만 사용 시
# package.json에서 rrweb 제거 후
pnpm add rrweb-snapshot@2.0.0-alpha.4 @rrweb/types@2.0.0-alpha.4
pnpm build
# dist 폴더 크기 비교
```

## 🎯 최종 권장사항

**스냅샷만 기록하는 경우 `rrweb-snapshot`만 사용하는 것을 권장합니다.**

이유:

1. ✅ 번들 크기 약 80% 감소
2. ✅ 메모리 사용량 감소
3. ✅ 성능 향상 (리스너 오버헤드 제거)
4. ✅ 목적에 맞는 최소한의 코드만 포함

단, 다음 사항을 고려하세요:

- `rrweb-snapshot`과 `@rrweb/types`를 별도로 설치해야 함
- 직접 구현이 필요하지만 복잡하지 않음
- 타입 정의는 `@rrweb/types`에서 제공됨

## 📝 구현 예시

`useRRWebSnapshot.ts` 파일을 참고하세요.
현재는 `rrweb`의 `record()`를 사용하지만,
`rrweb-snapshot`만 사용하도록 수정할 수 있습니다.
