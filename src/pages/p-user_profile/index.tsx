

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/AppShell';
import { Select } from '../../components/ui/select';
import { AnimatedAlert } from '../../components/ui/animated-alert';
import { AiConfig, loadAiConfig, saveAiConfig } from '../../lib/storage';
import { testGeminiConnection } from '../../lib/gemini';
import styles from './styles.module.css';

interface BasicProfileForm {
  fullName: string;
  email: string;
  company: string;
  position: string;
  bio: string;
}

interface AccountSecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationPreferencesForm {
  emailProjectUpdates: boolean;
  emailSchemeCompleted: boolean;
  emailSystemUpdates: boolean;
  inappRealtime: boolean;
  inappSound: boolean;
}

type SettingType = 'basic' | 'security' | 'notifications' | 'ai';

const defaultAiConfig: AiConfig = {
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  apiKey: '',
  model: 'gemini-3-flash-preview',
  temperature: 0.2,
};

const UserProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeSetting, setActiveSetting] = useState<SettingType>('basic');
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; message: string; type: 'default' | 'destructive' | 'success' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'default'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showAlert = (message: string, type: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default', title: string = '') => {
    setAlertState({ open: true, title, message, type });
    setTimeout(() => setAlertState(prev => ({ ...prev, open: false })), 3000);
  };

  const [basicProfileForm, setBasicProfileForm] = useState<BasicProfileForm>({
    fullName: '张工程师',
    email: 'zhang.engineer@example.com',
    company: '电子科技有限公司',
    position: '硬件工程师',
    bio: '10年硬件开发经验，擅长嵌入式系统设计和PCB布局。在消费电子和工业控制领域有丰富经验。'
  });

  const [accountSecurityForm, setAccountSecurityForm] = useState<AccountSecurityForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationPreferencesForm, setNotificationPreferencesForm] = useState<NotificationPreferencesForm>({
    emailProjectUpdates: true,
    emailSchemeCompleted: true,
    emailSystemUpdates: false,
    inappRealtime: true,
    inappSound: false
  });

  const [aiConfigForm, setAiConfigForm] = useState<AiConfig>(() => loadAiConfig() ?? defaultAiConfig);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestError, setAiTestError] = useState<string | null>(null);
  const [aiTestSuccess, setAiTestSuccess] = useState<string | null>(null);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${t('profile.title')} - PCBTool.AI`;
    return () => { document.title = originalTitle; };
  }, [t]);

  const handleSettingChange = (settingType: SettingType) => {
    setActiveSetting(settingType);
  };

  const handleBasicProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    showAlert(t('profile.success_basic'), 'success');
  };

  const handleAccountSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = accountSecurityForm;

    // 简单验证
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert(t('profile.error_empty'), 'destructive');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(t('profile.error_password_match'), 'destructive');
      return;
    }

    if (newPassword.length < 8) {
      showAlert(t('profile.error_password_length'), 'destructive');
      return;
    }

    setIsSubmitting(true);

    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000));

    setAccountSecurityForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    setIsSubmitting(false);
    showAlert(t('profile.success_password'), 'success');
  };

  const handleNotificationPreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    showAlert(t('profile.success_notifications'), 'success');
  };

  const handleAiConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiConfigForm.baseUrl.trim() || !aiConfigForm.apiKey.trim() || !aiConfigForm.model.trim()) {
      showAlert(t('profile.error_ai_fields'), 'destructive');
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    const nextConfig = {
      ...aiConfigForm,
      baseUrl: aiConfigForm.baseUrl.trim(),
      apiKey: aiConfigForm.apiKey.trim(),
      model: aiConfigForm.model.trim(),
      lastTestOk: aiConfigForm.lastTestOk ?? false,
      lastTestedAt: aiConfigForm.lastTestedAt,
      lastTestError: aiConfigForm.lastTestError,
    };
    saveAiConfig(nextConfig);
    window.dispatchEvent(new Event('ai-config-updated'));
    setIsSubmitting(false);
    showAlert(t('profile.success_ai'), 'success');
  };

  const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, '');
  const buildEndpoint = (baseUrl: string, provider: AiConfig['provider']) => {
    const normalized = normalizeBaseUrl(baseUrl);
    if (provider === 'openai') {
      return normalized.endsWith('/v1') ? `${normalized}/chat/completions` : `${normalized}/v1/chat/completions`;
    }
    return normalized.endsWith('/v1') ? `${normalized}/messages` : `${normalized}/v1/messages`;
  };

  const handleAiConnectionTest = async () => {
    if (!aiConfigForm.apiKey.trim() || !aiConfigForm.model.trim()) {
      showAlert(t('profile.error_ai_fields'), 'destructive');
      return;
    }
    setAiTestError(null);
    setAiTestSuccess(null);
    setIsTestingAi(true);
    try {
      if (aiConfigForm.provider === 'gemini') {
        await testGeminiConnection(aiConfigForm.apiKey.trim(), aiConfigForm.model.trim());
      } else {
        const endpoint = buildEndpoint(aiConfigForm.baseUrl.trim(), aiConfigForm.provider);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers:
            aiConfigForm.provider === 'openai'
              ? {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${aiConfigForm.apiKey.trim()}`,
              }
              : {
                'Content-Type': 'application/json',
                'x-api-key': aiConfigForm.apiKey.trim(),
                'anthropic-version': '2023-06-01',
              },
          body:
            aiConfigForm.provider === 'openai'
              ? JSON.stringify({
                model: aiConfigForm.model.trim(),
                temperature: 0,
                max_tokens: 1,
                messages: [
                  { role: 'system', content: 'ping' },
                  { role: 'user', content: 'ping' },
                ],
              })
              : JSON.stringify({
                model: aiConfigForm.model.trim(),
                temperature: 0,
                max_tokens: 1,
                system: 'ping',
                messages: [{ role: 'user', content: 'ping' }],
              }),
        });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
      }

      const nextConfig: AiConfig = {
        ...aiConfigForm,
        baseUrl: aiConfigForm.baseUrl.trim(),
        apiKey: aiConfigForm.apiKey.trim(),
        model: aiConfigForm.model.trim(),
        lastTestOk: true,
        lastTestedAt: Date.now(),
        lastTestError: undefined,
      };
      saveAiConfig(nextConfig);
      window.dispatchEvent(new Event('ai-config-updated'));
      setAiConfigForm(nextConfig);
      setAiTestSuccess(t('profile.test_success'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile.test_failed');
      const nextConfig: AiConfig = {
        ...aiConfigForm,
        baseUrl: aiConfigForm.baseUrl.trim(),
        apiKey: aiConfigForm.apiKey.trim(),
        model: aiConfigForm.model.trim(),
        lastTestOk: false,
        lastTestedAt: Date.now(),
        lastTestError: message,
      };
      saveAiConfig(nextConfig);
      window.dispatchEvent(new Event('ai-config-updated'));
      setAiConfigForm(nextConfig);
      setAiTestError(message);
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleBasicProfileCancel = () => {
    setBasicProfileForm({
      fullName: '张工程师',
      email: 'zhang.engineer@example.com',
      company: '电子科技有限公司',
      position: '硬件工程师',
      bio: '10年硬件开发经验，擅长嵌入式系统设计和PCB布局。在消费电子和工业控制领域有丰富经验。'
    });
  };

  const handleAccountSecurityCancel = () => {
    setAccountSecurityForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleNotificationPreferencesCancel = () => {
    setNotificationPreferencesForm({
      emailProjectUpdates: true,
      emailSchemeCompleted: true,
      emailSystemUpdates: false,
      inappRealtime: true,
      inappSound: false
    });
  };

  const handleAiConfigCancel = () => {
    setAiConfigForm(loadAiConfig() ?? defaultAiConfig);
    setAiTestError(null);
    setAiTestSuccess(null);
  };

  return (
    <AppShell pageTitle={t('profile.title')} breadcrumb={[t('profile.breadcrumb_home'), t('profile.title')]}>

      {/* 设置内容区 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 设置项列表 */}
        <div className="w-full lg:w-64 bg-white rounded-2xl shadow-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg font-semibold text-text-primary">{t('profile.settings_options')}</h3>
            {/* 移动端快捷切换 */}
            <div className="lg:hidden w-40">
              <Select
                value={activeSetting}
                onChange={(value) => handleSettingChange(value as SettingType)}
                options={[
                  { label: t('profile.basic'), value: 'basic' },
                  { label: t('profile.security'), value: 'security' },
                  { label: t('profile.notifications'), value: 'notifications' },
                  { label: t('profile.ai'), value: 'ai' },
                ]}
              />
            </div>
          </div>

          <div className={`hidden lg:flex flex-col gap-2 space-y-2 ${styles.settingList}`}>
            <button
              onClick={() => handleSettingChange('basic')}
              className={`${styles.settingItem} ${activeSetting === 'basic' ? styles.settingItemActive : ''} w-full text-left px-4 py-3 rounded-lg transition-all`}
            >
              <i className={`fas fa-user mr-3 ${activeSetting === 'basic' ? 'text-white' : 'text-primary'}`}></i>
              <span className={`font-semibold ${activeSetting === 'basic' ? 'text-white' : 'text-text-primary'}`}>{t('profile.basic')}</span>
            </button>
            <button
              onClick={() => handleSettingChange('security')}
              className={`${styles.settingItem} ${activeSetting === 'security' ? styles.settingItemActive : ''} w-full text-left px-4 py-3 rounded-lg transition-all`}
            >
              <i className={`fas fa-shield-alt mr-3 ${activeSetting === 'security' ? 'text-white' : 'text-primary'}`}></i>
              <span className={`font-semibold ${activeSetting === 'security' ? 'text-white' : 'text-text-primary'}`}>{t('profile.security')}</span>
            </button>
            <button
              onClick={() => handleSettingChange('notifications')}
              className={`${styles.settingItem} ${activeSetting === 'notifications' ? styles.settingItemActive : ''} w-full text-left px-4 py-3 rounded-lg transition-all`}
            >
              <i className={`fas fa-bell mr-3 ${activeSetting === 'notifications' ? 'text-white' : 'text-primary'}`}></i>
              <span className={`font-semibold ${activeSetting === 'notifications' ? 'text-white' : 'text-text-primary'}`}>{t('profile.notifications')}</span>
            </button>
            <button
              onClick={() => handleSettingChange('ai')}
              className={`${styles.settingItem} ${activeSetting === 'ai' ? styles.settingItemActive : ''} w-full text-left px-4 py-3 rounded-lg transition-all`}
            >
              <i className={`fas fa-brain mr-3 ${activeSetting === 'ai' ? 'text-white' : 'text-primary'}`}></i>
              <span className={`font-semibold ${activeSetting === 'ai' ? 'text-white' : 'text-text-primary'}`}>{t('profile.ai')}</span>
            </button>
          </div>
        </div>

        {/* 设置内容显示区 */}
        <div className="flex-1 space-y-6">
          {/* 基本资料设置 */}
          {activeSetting === 'basic' && (
            <div className="bg-white rounded-2xl shadow-card p-4 md:p-6 lg:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-4 md:mb-6">{t('profile.basic')}</h3>
              <form onSubmit={handleBasicProfileSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label htmlFor="full-name" className="block text-sm font-medium text-text-primary">{t('profile.full_name')}</label>
                    <input
                      type="text"
                      id="full-name"
                      name="fullName"
                      value={basicProfileForm.fullName}
                      onChange={(e) => setBasicProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                      placeholder={t('profile.full_name')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary">{t('profile.email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={basicProfileForm.email}
                      onChange={(e) => setBasicProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                      placeholder={t('profile.email')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="company" className="block text-sm font-medium text-text-primary">{t('profile.company')}</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={basicProfileForm.company}
                    onChange={(e) => setBasicProfileForm(prev => ({ ...prev, company: e.target.value }))}
                    className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                    placeholder={t('profile.company')}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="position" className="block text-sm font-medium text-text-primary">{t('profile.position')}</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={basicProfileForm.position}
                    onChange={(e) => setBasicProfileForm(prev => ({ ...prev, position: e.target.value }))}
                    className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                    placeholder={t('profile.position')}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-text-primary">{t('profile.bio')}</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={basicProfileForm.bio}
                    onChange={(e) => setBasicProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary resize-none`}
                    placeholder={t('profile.bio_placeholder')}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBasicProfileCancel}
                    className="px-6 py-3 border border-border-primary text-text-primary rounded-lg hover:bg-bg-secondary transition-colors"
                  >
                      {t('profile.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? t('profile.saving') : t('profile.save')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 账号安全设置 */}
          {activeSetting === 'security' && (
            <div className="bg-white rounded-2xl shadow-card p-4 md:p-6 lg:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-4 md:mb-6">{t('profile.security')}</h3>
              <form onSubmit={handleAccountSecuritySubmit} className="space-y-4 md:space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary">{t('profile.security')}</h4>

                  <div className="space-y-2">
                    <label htmlFor="current-password" className="block text-sm font-medium text-text-primary">{t('profile.current_password')}</label>
                    <input
                      type="password"
                      id="current-password"
                      name="currentPassword"
                      value={accountSecurityForm.currentPassword}
                      onChange={(e) => setAccountSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                      placeholder={t('profile.current_password')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="new-password" className="block text-sm font-medium text-text-primary">{t('profile.new_password')}</label>
                    <input
                      type="password"
                      id="new-password"
                      name="newPassword"
                      value={accountSecurityForm.newPassword}
                      onChange={(e) => setAccountSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                      placeholder={`${t('profile.new_password')}${t('profile.password_hint')}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary">{t('profile.confirm_password')}</label>
                    <input
                      type="password"
                      id="confirm-password"
                      name="confirmPassword"
                      value={accountSecurityForm.confirmPassword}
                      onChange={(e) => setAccountSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                      placeholder={t('profile.confirm_password')}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-text-primary mb-4">{t('profile.login_history')}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-text-primary font-medium">{t('profile.recent_login')}</p>
                        <p className="text-sm text-text-secondary">2024-01-15 14:30</p>
                      </div>
                      <span className="text-sm text-success">{t('profile.status_normal')}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-text-primary font-medium">{t('profile.last_login')}</p>
                        <p className="text-sm text-text-secondary">2024-01-14 09:15</p>
                      </div>
                      <span className="text-sm text-success">{t('profile.status_normal')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleAccountSecurityCancel}
                    className="px-6 py-3 border border-border-primary text-text-primary rounded-lg hover:bg-bg-secondary transition-colors"
                  >
                      {t('profile.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? t('profile.saving') : t('profile.save')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 通知偏好设置 */}
          {activeSetting === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-card p-4 md:p-6 lg:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-4 md:mb-6">{t('profile.notifications')}</h3>
              <form onSubmit={handleNotificationPreferencesSubmit} className="space-y-4 md:space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary">{t('profile.email_notifications')}</h4>

                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">{t('profile.project_updates')}</p>
                      <p className="text-sm text-text-secondary">{t('profile.project_updates_desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferencesForm.emailProjectUpdates}
                        onChange={(e) => setNotificationPreferencesForm(prev => ({ ...prev, emailProjectUpdates: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">{t('profile.scheme_completed')}</p>
                      <p className="text-sm text-text-secondary">{t('profile.scheme_completed_desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferencesForm.emailSchemeCompleted}
                        onChange={(e) => setNotificationPreferencesForm(prev => ({ ...prev, emailSchemeCompleted: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">{t('profile.system_updates')}</p>
                      <p className="text-sm text-text-secondary">{t('profile.system_updates_desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferencesForm.emailSystemUpdates}
                        onChange={(e) => setNotificationPreferencesForm(prev => ({ ...prev, emailSystemUpdates: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-text-primary mb-4">{t('profile.inapp_notifications')}</h4>

                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">{t('profile.realtime_messages')}</p>
                      <p className="text-sm text-text-secondary">{t('profile.realtime_messages_desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferencesForm.inappRealtime}
                        onChange={(e) => setNotificationPreferencesForm(prev => ({ ...prev, inappRealtime: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">{t('profile.sound_alerts')}</p>
                      <p className="text-sm text-text-secondary">{t('profile.sound_alerts_desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferencesForm.inappSound}
                        onChange={(e) => setNotificationPreferencesForm(prev => ({ ...prev, inappSound: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleNotificationPreferencesCancel}
                    className="px-6 py-3 border border-border-primary text-text-primary rounded-lg hover:bg-bg-secondary transition-colors"
                  >
                      {t('profile.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? t('profile.saving') : t('profile.save')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSetting === 'ai' && (
            <div className="bg-white rounded-2xl shadow-card p-4 md:p-6 lg:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-2">{t('profile.ai')}</h3>
              <p className="text-sm text-text-secondary mb-4 md:mb-6">{t('profile.ai_config_desc')}</p>
              <form onSubmit={handleAiConfigSubmit} className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">{t('profile.provider')}</label>
                  <Select
                    value={aiConfigForm.provider}
                    onChange={(value) => {
                      const provider = value as AiConfig['provider'];
                      const baseUrlMap: Record<string, string> = {
                        gemini: 'https://generativelanguage.googleapis.com/v1beta',
                        openai: 'https://api.openai.com/v1',
                        anthropic: 'https://api.anthropic.com',
                      };
                      const modelMap: Record<string, string> = {
                        gemini: 'gemini-3-flash-preview',
                        openai: 'gpt-4o-mini',
                        anthropic: 'claude-3-5-sonnet-20241022',
                      };
                      setAiConfigForm(prev => ({
                        ...prev,
                        provider,
                        baseUrl: baseUrlMap[provider] ?? prev.baseUrl,
                        model: modelMap[provider] ?? prev.model,
                      }));
                    }}
                    options={[
                      { label: 'Google Gemini', value: 'gemini' },
                      { label: 'OpenAI', value: 'openai' },
                      { label: 'Anthropic', value: 'anthropic' },
                    ]}
                    placeholder={t('profile.provider')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">{t('profile.base_url')}</label>
                  <input
                    type="text"
                    value={aiConfigForm.baseUrl}
                    onChange={(e) => setAiConfigForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                    className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">{t('profile.api_key')}</label>
                  <input
                    type="password"
                    value={aiConfigForm.apiKey}
                    onChange={(e) => setAiConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                    placeholder="sk-..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-primary">{t('profile.model_name')}</label>
                    <input
                      type="text"
                      value={aiConfigForm.model}
                      onChange={(e) => setAiConfigForm(prev => ({ ...prev, model: e.target.value }))}
                      className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                      placeholder="gpt-4o-mini / claude-3-5-sonnet"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-primary">{t('profile.temperature')}</label>
                    <input
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={aiConfigForm.temperature ?? 0.2}
                      onChange={(e) => setAiConfigForm(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                      className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} text-text-primary`}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4">
                  <div className="text-sm">
                    {aiTestSuccess && (
                      <span className="text-success">{aiTestSuccess}</span>
                    )}
                    {!aiTestSuccess && aiTestError && (
                      <span className="text-danger">{aiTestError}</span>
                    )}
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-end space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={handleAiConnectionTest}
                      disabled={isTestingAi}
                      className="w-full md:w-auto px-6 py-3 border border-border-primary text-text-primary rounded-lg hover:bg-bg-secondary transition-colors disabled:opacity-50"
                    >
                      {isTestingAi ? t('profile.testing') : t('profile.test_connection')}
                    </button>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={handleAiConfigCancel}
                        className="flex-1 md:flex-none px-6 py-3 border border-border-primary text-text-primary rounded-lg hover:bg-bg-secondary transition-colors"
                      >
                        {t('profile.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 md:flex-none px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? t('profile.saving') : t('profile.save_config')}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      {/* 成功提示消息 */}
      <AnimatedAlert
        open={alertState.open}
        variant={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
      />
    </AppShell>
  );
};

export default UserProfilePage;
