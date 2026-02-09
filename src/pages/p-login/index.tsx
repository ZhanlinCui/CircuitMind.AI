

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ForgotPasswordFormData {
  email: string;
}

interface SuccessModalData {
  isVisible: boolean;
  message: string;
  isSuccess: boolean;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 页面状态
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  
  // 密码可见性状态
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  // 表单数据状态
  const [loginFormData, setLoginFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false
  });
  
  const [registerFormData, setRegisterFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [forgotPasswordFormData, setForgotPasswordFormData] = useState<ForgotPasswordFormData>({
    email: ''
  });
  
  // 成功模态框数据
  const [successModalData, setSuccessModalData] = useState<SuccessModalData>({
    isVisible: false,
    message: '',
    isSuccess: true
  });
  
  // 加载状态
  const [isLoginLoading, setIsLoginLoading] = useState<boolean>(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState<boolean>(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState<boolean>(false);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '登录 - PCBTool.AI';
    return () => { document.title = originalTitle; };
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForgotPasswordModal) {
          setShowForgotPasswordModal(false);
        }
        if (showSuccessModal) {
          setShowSuccessModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForgotPasswordModal, showSuccessModal]);

  // 切换到注册模式
  const handleSwitchToRegister = () => {
    setIsLoginMode(false);
  };

  // 切换到登录模式
  const handleSwitchToLogin = () => {
    setIsLoginMode(true);
  };

  // 密码显示/隐藏切换函数
  const togglePasswordVisibility = (field: 'login' | 'register' | 'confirm') => {
    switch (field) {
    case 'login':
      setShowLoginPassword(!showLoginPassword);
      break;
    case 'register':
      setShowRegisterPassword(!showRegisterPassword);
      break;
    case 'confirm':
      setShowConfirmPassword(!showConfirmPassword);
      break;
    }
  };

  // 登录表单提交
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { username, password } = loginFormData;
    
    if (!username.trim() || !password.trim()) {
      showSuccessModalMessage('请填写完整的登录信息', false);
      return;
    }
    
    setIsLoginLoading(true);
    
    // 模拟登录过程
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  // 注册表单提交
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { username, email, password, confirmPassword } = registerFormData;
    
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showSuccessModalMessage('请填写完整的注册信息', false);
      return;
    }
    
    if (password !== confirmPassword) {
      showSuccessModalMessage('两次输入的密码不一致', false);
      return;
    }
    
    if (password.length < 8) {
      showSuccessModalMessage('密码长度至少8位', false);
      return;
    }
    
    setIsRegisterLoading(true);
    
    // 模拟注册过程
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  // 忘记密码表单提交
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { email } = forgotPasswordFormData;
    
    if (!email.trim()) {
      showSuccessModalMessage('请输入邮箱地址', false);
      return;
    }
    
    setIsForgotPasswordLoading(true);
    
    // 模拟发送重置链接
    setTimeout(() => {
      setShowForgotPasswordModal(false);
      showSuccessModalMessage('重置密码链接已发送到您的邮箱，请查收');
      
      // 重置表单
      setForgotPasswordFormData({ email: '' });
      setIsForgotPasswordLoading(false);
    }, 1500);
  };

  // 显示成功/错误提示
  const showSuccessModalMessage = (message: string, isSuccess: boolean = true) => {
    setSuccessModalData({
      isVisible: true,
      message,
      isSuccess
    });
    setShowSuccessModal(true);
  };

  // 关闭成功模态框
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // 点击模态框背景关闭
  const handleModalBackgroundClick = (e: React.MouseEvent, closeHandler: () => void) => {
    if (e.target === e.currentTarget) {
      closeHandler();
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-20 left-20 w-32 h-32 bg-white bg-opacity-10 rounded-full ${styles.floatingAnimation}`}></div>
        <div className={`absolute top-40 right-32 w-24 h-24 bg-white bg-opacity-10 rounded-full ${styles.floatingAnimation} ${styles.floatingDelay1}`}></div>
        <div className={`absolute bottom-32 left-1/4 w-16 h-16 bg-white bg-opacity-10 rounded-full ${styles.floatingAnimation} ${styles.floatingDelay2}`}></div>
        <div className={`absolute bottom-20 right-20 w-20 h-20 bg-white bg-opacity-10 rounded-full ${styles.floatingAnimation} ${styles.floatingDelay3}`}></div>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 w-full max-w-md">
        {/* 登录卡片 */}
        {isLoginMode && (
          <div className={`${styles.loginCard} rounded-2xl shadow-card p-8 border border-white border-opacity-20`}>
            {/* Logo和标题 */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                  <i className="fas fa-microchip text-white text-2xl"></i>
                </div>
              </div>
              <h1 className={`text-3xl font-bold ${styles.gradientText} mb-2`}>PCBTool.AI</h1>
              <p className="text-text-secondary">智能电路工程生成系统</p>
            </div>

            {/* 登录表单 */}
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {/* 用户名/邮箱输入 */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-text-primary">
                  用户名/邮箱
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    value={loginFormData.username}
                    onChange={(e) => setLoginFormData({...loginFormData, username: e.target.value})}
                    className={`w-full pl-12 pr-4 py-3 border border-border-primary rounded-xl ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary`}
                    placeholder="请输入用户名或邮箱"
                    required
                  />
                  <i className="fas fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
                </div>
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  密码
                </label>
                <div className="relative">
                  <input 
                    type={showLoginPassword ? 'text' : 'password'}
                    id="password" 
                    name="password" 
                    value={loginFormData.password}
                    onChange={(e) => setLoginFormData({...loginFormData, password: e.target.value})}
                    className={`w-full pl-12 pr-12 py-3 border border-border-primary rounded-xl ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary`}
                    placeholder="请输入密码"
                    required
                  />
                  <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
                  <button 
                    type="button" 
                    onClick={() => togglePasswordVisibility('login')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  >
                    <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* 记住密码和忘记密码 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={loginFormData.rememberMe}
                    onChange={(e) => setLoginFormData({...loginFormData, rememberMe: e.target.checked})}
                    className="w-4 h-4 text-primary bg-white border-border-primary rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-text-secondary">记住密码</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-sm text-primary hover:text-secondary transition-colors font-medium"
                >
                  忘记密码？
                </button>
              </div>

              {/* 登录按钮 */}
              <button 
                type="submit" 
                disabled={isLoginLoading}
                className="w-full bg-gradient-primary text-white py-3 rounded-xl font-semibold text-lg hover:shadow-glow transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoginLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    登录中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    登录
                  </>
                )}
              </button>
            </form>

            {/* 切换到注册 */}
            <div className="mt-8 text-center">
              <p className="text-text-secondary">
                还没有账户？
                <button 
                  type="button" 
                  onClick={handleSwitchToRegister}
                  className="text-primary hover:text-secondary transition-colors font-medium ml-1"
                >
                  立即注册
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 注册卡片 */}
        {!isLoginMode && (
          <div className={`${styles.loginCard} rounded-2xl shadow-card p-8 border border-white border-opacity-20`}>
            {/* Logo和标题 */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-16 h-16 bg-gradient-secondary rounded-xl flex items-center justify-center shadow-glow-secondary">
                  <i className="fas fa-user-plus text-white text-2xl"></i>
                </div>
              </div>
              <h1 className={`text-3xl font-bold ${styles.gradientText} mb-2`}>创建账户</h1>
              <p className="text-text-secondary">加入PCBTool.AI，开启智能电路设计之旅</p>
            </div>

            {/* 注册表单 */}
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* 用户名输入 */}
              <div className="space-y-2">
                <label htmlFor="register-username" className="block text-sm font-medium text-text-primary">
                  用户名
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="register-username" 
                    name="register-username" 
                    value={registerFormData.username}
                    onChange={(e) => setRegisterFormData({...registerFormData, username: e.target.value})}
                    className={`w-full pl-12 pr-4 py-3 border border-border-primary rounded-xl ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary`}
                    placeholder="请输入用户名"
                    required
                  />
                  <i className="fas fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
                </div>
              </div>

              {/* 邮箱输入 */}
              <div className="space-y-2">
                <label htmlFor="register-email" className="block text-sm font-medium text-text-primary">
                  邮箱
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    id="register-email" 
                    name="register-email" 
                    value={registerFormData.email}
                    onChange={(e) => setRegisterFormData({...registerFormData, email: e.target.value})}
                    className={`w-full pl-12 pr-4 py-3 border border-border-primary rounded-xl ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary`}
                    placeholder="请输入邮箱地址"
                    required
                  />
                  <i className="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
                </div>
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <label htmlFor="register-password" className="block text-sm font-medium text-text-primary">
                  密码
                </label>
                <div className="relative">
                  <input 
                    type={showRegisterPassword ? 'text' : 'password'}
                    id="register-password" 
                    name="register-password" 
                    value={registerFormData.password}
                    onChange={(e) => setRegisterFormData({...registerFormData, password: e.target.value})}
                    className={`w-full pl-12 pr-12 py-3 border border-border-primary rounded-xl ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary`}
                    placeholder="请输入密码（至少8位）"
                    required
                    minLength={8}
                  />
                  <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
                  <button 
                    type="button" 
                    onClick={() => togglePasswordVisibility('register')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  >
                    <i className={`fas ${showRegisterPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* 确认密码输入 */}
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary">
                  确认密码
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password" 
                    name="confirm-password" 
                    value={registerFormData.confirmPassword}
                    onChange={(e) => setRegisterFormData({...registerFormData, confirmPassword: e.target.value})}
                    className={`w-full pl-12 pr-12 py-3 border border-border-primary rounded-xl ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary`}
                    placeholder="请再次输入密码"
                    required
                  />
                  <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
                  <button 
                    type="button" 
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* 注册按钮 */}
              <button 
                type="submit" 
                disabled={isRegisterLoading}
                className="w-full bg-gradient-secondary text-white py-3 rounded-xl font-semibold text-lg hover:shadow-glow-secondary transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isRegisterLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    注册中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i>
                    注册
                  </>
                )}
              </button>
            </form>

            {/* 切换到登录 */}
            <div className="mt-8 text-center">
              <p className="text-text-secondary">
                已有账户？
                <button 
                  type="button" 
                  onClick={handleSwitchToLogin}
                  className="text-primary hover:text-secondary transition-colors font-medium ml-1"
                >
                  立即登录
                </button>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 忘记密码模态框 */}
      {showForgotPasswordModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleModalBackgroundClick(e, () => setShowForgotPasswordModal(false))}
        >
          <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-warning bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-key text-warning text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">重置密码</h3>
              <p className="text-text-secondary">请输入您的邮箱地址，我们将发送重置密码的链接</p>
            </div>
            
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-text-primary mb-2">邮箱地址</label>
                <input 
                  type="email" 
                  id="forgot-email" 
                  name="forgot-email" 
                  value={forgotPasswordFormData.email}
                  onChange={(e) => setForgotPasswordFormData({email: e.target.value})}
                  className={`w-full px-4 py-3 border border-border-primary rounded-xl ${styles.formInputFocus}`}
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="flex-1 px-4 py-3 border border-border-primary rounded-xl text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={isForgotPasswordLoading}
                  className="flex-1 bg-gradient-primary text-white py-3 rounded-xl font-medium hover:shadow-glow transition-all"
                >
                  {isForgotPasswordLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      发送中...
                    </>
                  ) : (
                    <>
                      发送链接
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 成功提示模态框 */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleModalBackgroundClick(e, handleCloseSuccessModal)}
        >
          <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-md mx-4">
            <div className="text-center">
              <div className={`w-16 h-16 ${successModalData.isSuccess ? 'bg-success' : 'bg-warning'} bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <i className={`fas ${successModalData.isSuccess ? 'fa-check text-success' : 'fa-exclamation-triangle text-warning'} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">操作成功</h3>
              <p className="text-text-secondary mb-6">{successModalData.message}</p>
              <button 
                type="button" 
                onClick={handleCloseSuccessModal}
                className="w-full bg-gradient-primary text-white py-3 rounded-xl font-medium hover:shadow-glow transition-all"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;

