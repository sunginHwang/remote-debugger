import { useEffect } from 'react';
import { initRRWebSDK } from '@repo/rrweb-sdk-4';

export default function App() {
  useEffect(() => {
    const sdkInstance = initRRWebSDK({
      serverUrl: 'http://localhost:5543/rrweb/events',
    });

    return () => {
      sdkInstance.stop();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>🎥 RRWeb SDK Demo</h1>
        <p style={styles.description}>SDK UI 컴포넌트를 실시간으로 테스트하고 개발할 수 있는 데모 페이지입니다.</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  description: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px',
  },
  modeSelector: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
  },
  modeButton: {
    padding: '12px 24px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderColor: 'transparent',
  },
  section: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  button: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  info: {
    padding: '16px',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px',
  },
  componentTest: {
    marginBottom: '32px',
    paddingBottom: '32px',
    borderBottom: '1px solid #e5e7eb',
  },
  componentTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  componentDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  interactiveElements: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  testButton: {
    padding: '12px 24px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  testInput: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
  },
  testSelect: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
  },
  testTextarea: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '100px',
    gridColumn: '1 / -1',
  },
};
