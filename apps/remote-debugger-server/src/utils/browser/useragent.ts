interface ParsedUserAgent {
  deviceType: "mobile" | "pc";
  os: string;
  osVersion?: string;
  device?: string; // 모바일인 경우 기기 모델
  browser: string;
  browserVersion: string;
  appVersion?: string; // ZigZag 앱 버전
  isWebView: boolean;
}

/**
 * 브라우저 정보를 파싱합니다.
 */
export function parseZigzagUserAgent(userAgent: string): ParsedUserAgent {
  const result: ParsedUserAgent = {
    deviceType: "pc",
    os: "Unknown",
    browser: "Unknown",
    browserVersion: "",
    isWebView: false,
  };

  // WebView 체크
  result.isWebView = /wv/.test(userAgent);

  // 모바일 여부 확인
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(userAgent);
  result.deviceType = isMobile ? "mobile" : "pc";

  // Android 정보 추출
  const androidMatch = userAgent.match(/Android\s+([\d.]+)/);
  if (androidMatch) {
    result.os = "Android";
    result.osVersion = androidMatch[1];
  }

  // iOS 정보 추출
  const iosMatch = userAgent.match(/iPhone OS ([\d_]+)|iPad.*OS ([\d_]+)/);
  if (iosMatch) {
    result.os = "iOS";
    result.osVersion = (iosMatch[1] || iosMatch[2]).replace(/_/g, ".");
  }

  // PC OS 정보 추출
  if (!androidMatch && !iosMatch) {
    if (/Windows NT ([\d.]+)/.test(userAgent)) {
      const windowsMatch = userAgent.match(/Windows NT ([\d.]+)/);
      result.os = "Windows";
      result.osVersion = windowsMatch?.[1];
    } else if (/Mac OS X ([\d_]+)/.test(userAgent)) {
      const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
      result.os = "macOS";
      result.osVersion = macMatch?.[1].replace(/_/g, ".");
    } else if (/Linux/.test(userAgent)) {
      result.os = "Linux";
    }
  }

  // 모바일 기기 모델 추출 (Android)
  const deviceMatch = userAgent.match(/Android[^;]*;\s*([^;)]+)/);
  if (deviceMatch) {
    // "SM-S906N Build/..." 형태에서 기기명만 추출
    const deviceInfo = deviceMatch[1].trim();
    const deviceName = deviceInfo.split(/\s+Build\//)[0].trim();
    result.device = deviceName;
  }

  // iOS 기기 모델 추출
  if (/iPhone/.test(userAgent)) {
    result.device = "iPhone";
  } else if (/iPad/.test(userAgent)) {
    result.device = "iPad";
  }

  // 브라우저 정보 추출
  const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
  const safariMatch = userAgent.match(/Version\/([\d.]+).*Safari/);
  const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/);
  const edgeMatch = userAgent.match(/Edg\/([\d.]+)/);

  if (edgeMatch) {
    result.browser = "Edge";
    result.browserVersion = edgeMatch[1];
  } else if (chromeMatch) {
    result.browser = "Chrome";
    result.browserVersion = chromeMatch[1];
  } else if (firefoxMatch) {
    result.browser = "Firefox";
    result.browserVersion = firefoxMatch[1];
  } else if (safariMatch) {
    result.browser = "Safari";
    result.browserVersion = safariMatch[1];
  }

  // ZigZag 앱 버전 추출
  const zigzagMatch = userAgent.match(/ZigZag\/([\d.]+)/);
  if (zigzagMatch) {
    result.appVersion = zigzagMatch[1];
  }

  return result;
}
