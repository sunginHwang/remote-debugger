# rrweb 플레이어에서 Chrome DevTools 사용 가이드

## 📋 개요

rrweb 플레이어를 통해 재생되는 특정 시점의 DOM 정보와 네트워크 정보를 Chrome DevTools로 확인하는 방법을 설명합니다.

## ✅ 가능 여부

### 1. DOM 정보 확인 - **가능** ✅

rrweb 플레이어는 실제 DOM을 재생합니다:
- 재생되는 DOM은 **iframe 내부**에 생성됩니다
- Chrome DevTools로 **실제 DOM 구조를 검사**할 수 있습니다
- Elements 탭에서 모든 DOM 노드를 확인할 수 있습니다

### 2. 네트워크 정보 확인 - **제한적** ⚠️

**기본 동작:**
- rrweb은 네트워크 요청을 **기록하지 않습니다** (기본 설정)
- 재생 시 실제 네트워크 요청이 **발생하지 않습니다**
- Network 탭에는 아무것도 표시되지 않습니다

**해결 방법:**
- rrweb의 네트워크 플러그인을 사용하거나
- 커스텀 이벤트로 네트워크 요청을 기록해야 합니다

## 🔍 Chrome DevTools로 DOM 확인하기

### 방법 1: Elements 탭에서 직접 검사

1. **플레이어 실행**
   ```typescript
   playerControllerRef.current = new rrwebPlayer({
     target: playerRef.current,
     props: { events: emits },
   });
   ```

2. **Chrome DevTools 열기** (F12 또는 Cmd+Option+I)

3. **Elements 탭에서 iframe 찾기**
   - Elements 탭에서 `<iframe>` 태그를 찾습니다
   - rrweb 플레이어는 내부적으로 iframe을 생성합니다
   - iframe 내부의 DOM을 클릭하여 검사합니다

4. **특정 시점으로 이동**
   - 플레이어 컨트롤에서 특정 시점으로 이동
   - 해당 시점의 DOM 상태를 Elements 탭에서 확인

### 방법 2: 코드로 iframe 접근

```typescript
// 플레이어 인스턴스에서 iframe 가져오기
const replayer = playerControllerRef.current?.getReplayer();
const iframe = replayer?.iframe; // HTMLIFrameElement

// iframe 내부의 document 접근
const iframeDocument = iframe?.contentDocument;
const iframeWindow = iframe?.contentWindow;

// Chrome DevTools에서 확인 가능
console.log('iframe DOM:', iframeDocument?.body);
```

### 방법 3: React DevTools와 함께 사용

- React DevTools로 플레이어 컴포넌트 검사
- Chrome DevTools Elements 탭으로 실제 재생 DOM 검사
- 두 가지를 함께 사용하면 더 효과적입니다

## 🌐 네트워크 정보 확인하기

### 문제점

rrweb은 기본적으로 네트워크 요청을 기록하지 않습니다:
- `fetch()`, `XMLHttpRequest` 등의 네트워크 요청은 기록되지 않음
- 재생 시 실제 네트워크 요청이 발생하지 않음

### 해결 방법

#### 방법 1: 네트워크 요청을 커스텀 이벤트로 기록

```typescript
// 레코딩 시
const recordNetworkRequest = (url: string, method: string, response: any) => {
  record.addCustomEvent('network-request', {
    url,
    method,
    response,
    timestamp: Date.now(),
  });
};

// fetch 래핑
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const data = await response.clone().json();
  recordNetworkRequest(args[0] as string, 'GET', data);
  return response;
};
```

#### 방법 2: rrweb 플러그인 사용

rrweb은 플러그인 시스템을 제공합니다. 네트워크 요청을 기록하는 커스텀 플러그인을 만들 수 있습니다.

#### 방법 3: 재생 시 네트워크 요청 재실행 (비권장)

재생 시 실제 네트워크 요청을 다시 보내는 것은:
- ❌ 보안 문제 (인증 토큰 등)
- ❌ 서버 부하
- ❌ 데이터 변경 위험

따라서 **권장하지 않습니다**.

## 🛠️ 실전 예제

### DOM 검사 유틸리티 함수

```typescript
// RrwebPlayer.tsx에 추가
const inspectReplayDOM = () => {
  const replayer = playerControllerRef.current?.getReplayer();
  if (!replayer) {
    console.warn('Replayer not found');
    return;
  }

  const iframe = replayer.iframe;
  if (!iframe) {
    console.warn('Iframe not found');
    return;
  }

  const iframeDocument = iframe.contentDocument;
  if (!iframeDocument) {
    console.warn('Cannot access iframe document');
    return;
  }

  // DOM 정보 출력
  console.log('Replay DOM:', {
    body: iframeDocument.body,
    html: iframeDocument.documentElement,
    allElements: iframeDocument.querySelectorAll('*'),
  });

  // Chrome DevTools에서 확인 가능
  return iframeDocument;
};
```

### 네트워크 요청 기록 예제

```typescript
// 레코딩 시 네트워크 요청 기록
import { record } from 'rrweb';

// 네트워크 요청 인터셉터
const setupNetworkRecording = () => {
  // fetch 인터셉트
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0] as string;
    const options = args[1] || {};
    
    try {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();
      
      // 커스텀 이벤트로 기록
      record.addCustomEvent('network-fetch', {
        url,
        method: options.method || 'GET',
        status: response.status,
        timestamp: Date.now(),
        // 응답 데이터는 크기가 클 수 있으므로 선택적으로 기록
      });
      
      return response;
    } catch (error) {
      record.addCustomEvent('network-error', {
        url,
        error: error.message,
        timestamp: Date.now(),
      });
      throw error;
    }
  };

  // XMLHttpRequest 인터셉트
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this.addEventListener('load', function() {
      record.addCustomEvent('network-xhr', {
        url,
        method,
        status: this.status,
        timestamp: Date.now(),
      });
    });
    return originalXHROpen.call(this, method, url, ...args);
  };
};
```

## 📊 확인 가능한 정보 요약

| 정보 유형 | 확인 가능 여부 | 방법 |
|----------|--------------|------|
| **DOM 구조** | ✅ 가능 | Elements 탭에서 iframe 내부 검사 |
| **DOM 속성** | ✅ 가능 | Elements 탭에서 속성 확인 |
| **스타일 (CSS)** | ✅ 가능 | Elements 탭의 Styles 패널 |
| **이벤트 리스너** | ✅ 가능 | Elements 탭의 Event Listeners 패널 |
| **실제 네트워크 요청** | ❌ 불가능 | 기본적으로 기록되지 않음 |
| **네트워크 요청 기록** | ⚠️ 커스텀 필요 | 커스텀 이벤트로 기록 필요 |

## 🎯 권장 사항

1. **DOM 검사**: Chrome DevTools Elements 탭을 적극 활용
2. **네트워크 정보**: 필요한 경우 커스텀 이벤트로 기록
3. **디버깅**: `getReplayer()` 메서드로 Replayer 인스턴스 접근
4. **특정 시점 확인**: 플레이어 컨트롤로 특정 시점으로 이동 후 검사

## 🔗 참고 자료

- [rrweb 공식 문서](https://github.com/rrweb-io/rrweb)
- [rrweb 플러그인 가이드](https://github.com/rrweb-io/rrweb/blob/master/docs/plugins.md)
- [Chrome DevTools 가이드](https://developer.chrome.com/docs/devtools/)

