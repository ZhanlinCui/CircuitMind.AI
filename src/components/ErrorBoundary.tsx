// src/components/ErrorBoundary.tsx

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null; // 保存错误对象本身
}

export class ErrorBoundary extends Component<Props, State> {
  // 1. 初始化 state
  public state: State = {
    hasError: false,
    error: null,
  };

  // 2. 当子组件抛出错误时，这个静态方法会被调用来更新 state
  public static getDerivedStateFromError(error: Error): State {
    // 更新 state，这会导致 UI 重新渲染
    return { hasError: true, error };
  }

  // 3. 在错误被捕获后，这个生命周期方法被调用，适合执行“副作用”，比如记日志
  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    if (!import.meta.env.DEV) {
      return;
    }
    console.log('ErrorBoundary 成功捕获错误，准备发送日志...');
    
    // send_error_message_to_parent_window 向父窗口发送错误信息
    if (typeof window === 'object' && window.parent) {
      window.parent.postMessage({
        type: 'chux:error',
        error: {
          message: error.message || 'Unknown error',
          stack: error.stack,
        },
      }, 'https://www.coze.cn');
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4'>
          <div className='w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <h1 className='text-xl font-semibold text-slate-900 mb-2'>
              Something went wrong
            </h1>
            <p className='text-sm text-slate-600 mb-4'>
              The page encountered an unexpected error. You can refresh and try
              again.
            </p>
            {import.meta.env.DEV && this.state.error ? (
              <pre className='mb-4 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100'>
                {this.state.error.message}
              </pre>
            ) : null}
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => window.location.reload()}
                className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors'
              >
                Reload
              </button>
              <button
                type='button'
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className='rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors'
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
