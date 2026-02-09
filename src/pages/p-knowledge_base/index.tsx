

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import styles from './styles.module.css';

const KnowledgeBasePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '知识库 - PCBTool.AI';
    return () => { document.title = originalTitle; };
  }, []);

  const handleCategoryComponentsClick = () => {
    navigate('/component-db');
  };

  const handleCategoryCasesClick = () => {
    navigate('/circuit-cases');
  };

  const handlePopularComponent1Click = () => {
    navigate('/component-db?component=ESP32-WROOM-32');
  };

  const handlePopularComponent2Click = () => {
    navigate('/component-db?component=LiPo-18650');
  };

  const handlePopularComponent3Click = () => {
    navigate('/component-db?component=DS18B20');
  };

  const handleFeaturedCase1Click = () => {
    navigate('/circuit-cases?case=smart-home-control');
  };

  const handleFeaturedCase2Click = () => {
    navigate('/circuit-cases?case=environment-monitor');
  };

  const handleFeaturedCase3Click = () => {
    navigate('/circuit-cases?case=portable-power');
  };

  const handleViewMoreCasesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/circuit-cases');
  };

  return (
    <AppShell pageTitle="知识库" breadcrumb={['工作台', '知识库']}>
      <>
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">元器件总数</p>
                  <p className={`${styles.statNumber} mt-1`}>1,245,678</p>
                </div>
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-microchip text-primary text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">电路案例</p>
                  <p className={`${styles.statNumber} mt-1`}>12,345</p>
                </div>
                <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-sitemap text-secondary text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">制造商</p>
                  <p className={`${styles.statNumber} mt-1`}>2,856</p>
                </div>
                <div className="w-12 h-12 bg-tertiary bg-opacity-10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-industry text-tertiary text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">今日更新</p>
                  <p className={`${styles.statNumber} mt-1`}>+156</p>
                </div>
                <div className="w-12 h-12 bg-success bg-opacity-10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-sync-alt text-success text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-text-primary mb-6">知识库分类</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              onClick={handleCategoryComponentsClick}
              className={`bg-gradient-card rounded-2xl p-6 shadow-card ${styles.categoryCard} cursor-pointer transition-all duration-300`}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                  <i className="fas fa-database text-white text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">元器件数据库</h4>
                  <p className="text-text-secondary">1,245,678 个元器件</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">包含各类电子元器件的详细参数、规格、价格和供应商信息，支持多维度搜索和筛选。</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm">
                  <span className="text-text-secondary">更新频率:</span>
                  <span className="text-primary font-medium">实时</span>
                </div>
                <i className="fas fa-arrow-right text-primary text-lg"></i>
              </div>
            </div>
            
            <div 
              onClick={handleCategoryCasesClick}
              className={`bg-gradient-card rounded-2xl p-6 shadow-card ${styles.categoryCard} cursor-pointer transition-all duration-300`}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center">
                  <i className="fas fa-circuit-board text-white text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">电路案例库</h4>
                  <p className="text-text-secondary">12,345 个案例</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">涵盖各种应用场景的电路设计案例，从简单的LED控制到复杂的嵌入式系统。</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm">
                  <span className="text-text-secondary">分类:</span>
                  <span className="text-success font-medium">28 个</span>
                </div>
                <i className="fas fa-arrow-right text-primary text-lg"></i>
              </div>
            </div>
            
            <div className={`bg-gradient-card rounded-2xl p-6 shadow-card ${styles.categoryCard} cursor-pointer transition-all duration-300`}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-warning rounded-2xl flex items-center justify-center">
                  <i className="fas fa-book-open text-white text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">设计指南</h4>
                  <p className="text-text-secondary">568 篇文档</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">包含电路设计最佳实践、PCB布局技巧、信号完整性分析等专业技术文档。</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm">
                  <span className="text-text-secondary">难度:</span>
                  <span className="text-info font-medium">初级到高级</span>
                </div>
                <i className="fas fa-arrow-right text-primary text-lg"></i>
              </div>
            </div>
            
            <div className={`bg-gradient-card rounded-2xl p-6 shadow-card ${styles.categoryCard} cursor-pointer transition-all duration-300`}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-tertiary rounded-2xl flex items-center justify-center">
                  <i className="fas fa-cube text-white text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">封装库</h4>
                  <p className="text-text-secondary">89,456 种封装</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">提供各种元器件的PCB封装文件，支持主流EDA软件格式。</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm">
                  <span className="text-text-secondary">格式:</span>
                  <span className="text-secondary font-medium">多种</span>
                </div>
                <i className="fas fa-arrow-right text-primary text-lg"></i>
              </div>
            </div>
            
            <div className={`bg-gradient-card rounded-2xl p-6 shadow-card ${styles.categoryCard} cursor-pointer transition-all duration-300`}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-info rounded-2xl flex items-center justify-center">
                  <i className="fas fa-certificate text-white text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">技术标准</h4>
                  <p className="text-text-secondary">234 项标准</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">包含电子行业相关的国际标准、国家标准和行业规范。</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm">
                  <span className="text-text-secondary">来源:</span>
                  <span className="text-success font-medium">权威机构</span>
                </div>
                <i className="fas fa-arrow-right text-primary text-lg"></i>
              </div>
            </div>
            
            <div className={`bg-gradient-card rounded-2xl p-6 shadow-card ${styles.categoryCard} cursor-pointer transition-all duration-300`}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-danger rounded-2xl flex items-center justify-center">
                  <i className="fas fa-tools text-white text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">工具手册</h4>
                  <p className="text-text-secondary">156 份手册</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">主流EDA软件使用指南、调试工具使用方法等实用文档。</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm">
                  <span className="text-text-secondary">软件:</span>
                  <span className="text-warning font-medium">Altium, KiCad等</span>
                </div>
                <i className="fas fa-arrow-right text-primary text-lg"></i>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-text-primary">热门内容</h3>
            <a 
              href="/circuit-cases" 
              onClick={handleViewMoreCasesClick}
              className="text-primary hover:text-secondary transition-colors font-medium"
            >
              查看更多案例 <i className="fas fa-arrow-right ml-1"></i>
            </a>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-card">
              <div className="p-6 border-b border-border-primary">
                <h4 className="font-semibold text-text-primary flex items-center">
                  <i className="fas fa-fire text-danger mr-2"></i>
                  热门元器件
                </h4>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div 
                    onClick={handlePopularComponent1Click}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-microchip text-primary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">ESP32-WROOM-32</p>
                        <p className="text-sm text-text-secondary">Wi-Fi & 蓝牙模块</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">¥25.8</p>
                      <p className="text-xs text-text-secondary">热度 98%</p>
                    </div>
                  </div>
                  
                  <div 
                    onClick={handlePopularComponent2Click}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-battery-three-quarters text-secondary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">LiPo 18650</p>
                        <p className="text-sm text-text-secondary">锂电池</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">¥12.5</p>
                      <p className="text-xs text-text-secondary">热度 85%</p>
                    </div>
                  </div>
                  
                  <div 
                    onClick={handlePopularComponent3Click}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-tertiary bg-opacity-10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-thermometer-half text-tertiary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">DS18B20</p>
                        <p className="text-sm text-text-secondary">温度传感器</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">¥3.2</p>
                      <p className="text-xs text-text-secondary">热度 76%</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <Link to="/component-db" className="text-primary hover:text-secondary transition-colors font-medium">
                    查看全部元器件 <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-card">
              <div className="p-6 border-b border-border-primary">
                <h4 className="font-semibold text-text-primary flex items-center">
                  <i className="fas fa-star text-warning mr-2"></i>
                  精选案例
                </h4>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div 
                    onClick={handleFeaturedCase1Click}
                    className="p-4 rounded-lg border border-border-primary hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-text-primary">智能家居控制板</h5>
                      <span className="px-2 py-1 bg-success bg-opacity-10 text-success rounded-full text-xs">完整</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">基于ESP32的智能家居控制中心，支持WiFi、蓝牙和红外控制。</p>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span><i className="fas fa-eye mr-1"></i>1,247 次浏览</span>
                      <span><i className="fas fa-download mr-1"></i>324 次下载</span>
                    </div>
                  </div>
                  
                  <div 
                    onClick={handleFeaturedCase2Click}
                    className="p-4 rounded-lg border border-border-primary hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-text-primary">环境监测节点</h5>
                      <span className="px-2 py-1 bg-success bg-opacity-10 text-success rounded-full text-xs">完整</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">集成温湿度、光照、PM2.5传感器的物联网监测设备。</p>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span><i className="fas fa-eye mr-1"></i>986 次浏览</span>
                      <span><i className="fas fa-download mr-1"></i>256 次下载</span>
                    </div>
                  </div>
                  
                  <div 
                    onClick={handleFeaturedCase3Click}
                    className="p-4 rounded-lg border border-border-primary hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-text-primary">便携式电源管理</h5>
                      <span className="px-2 py-1 bg-success bg-opacity-10 text-success rounded-full text-xs">完整</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">包含锂电池充放电管理、USB输出的移动电源解决方案。</p>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span><i className="fas fa-eye mr-1"></i>756 次浏览</span>
                      <span><i className="fas fa-download mr-1"></i>189 次下载</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <Link to="/circuit-cases" className="text-primary hover:text-secondary transition-colors font-medium">
                    查看全部案例 <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-text-primary mb-6">最近更新</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-plus text-success text-sm"></i>
                </div>
                <span className="text-sm font-medium text-text-primary">新增元器件</span>
              </div>
              <p className="text-sm text-text-secondary mb-2">新增了STM32H7系列微控制器的完整参数和封装信息</p>
              <p className="text-xs text-text-secondary">2小时前</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-info bg-opacity-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-sync-alt text-info text-sm"></i>
                </div>
                <span className="text-sm font-medium text-text-primary">价格更新</span>
              </div>
              <p className="text-sm text-text-secondary mb-2">更新了1,234个元器件的实时价格信息</p>
              <p className="text-xs text-text-secondary">4小时前</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-alt text-warning text-sm"></i>
                </div>
                <span className="text-sm font-medium text-text-primary">新增案例</span>
              </div>
              <p className="text-sm text-text-secondary mb-2">新增了“太阳能充电控制器”完整设计案例</p>
              <p className="text-xs text-text-secondary">1天前</p>
            </div>
          </div>
        </section>
      </>
    </AppShell>
  );
};

export default KnowledgeBasePage;
