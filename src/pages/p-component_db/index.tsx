

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/AppShell';
import { Select } from '../../components/ui/select';
import { AnimatedAlert } from '../../components/ui/animated-alert';
import { MODULE_CATALOG } from '../../domain/moduleCatalog';
import { Project } from '../../domain/project';
import { Workflow, WorkflowNode, createId, getModuleById } from '../../domain/workflow';
import { getProjectById, listProjects, upsertProjectFromCreateInput } from '../../lib/projectsStore';
import styles from './styles.module.css';

interface Component {
  id: string;
  model: string;
  type: string;
  typeName: string;
  manufacturer: string;
  manufacturerName: string;
  package: string;
  packageName: string;
  price: number;
  specifications: Record<string, string>;
  datasheet?: string;
}

type SortField = 'model' | 'type' | 'manufacturer' | 'package' | 'price';
type SortOrder = 'asc' | 'desc';

const ComponentDatabase: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const projectIdFromQuery = searchParams.get('projectId') ?? undefined;

  // 模拟元器件数据
  const mockComponents: Component[] = [
    {
      id: 'comp1',
      model: 'STM32F103C8T6',
      type: 'microcontroller',
      typeName: '主控芯片',
      manufacturer: 'st',
      manufacturerName: 'STMicroelectronics',
      package: 'lqfp',
      packageName: 'LQFP48',
      price: 15.80,
      specifications: {
        '核心架构': 'ARM Cortex-M3',
        '主频': '72 MHz',
        'Flash': '64 KB',
        'RAM': '20 KB',
        '工作电压': '2.0V - 3.6V',
        '温度范围': '-40°C to 85°C'
      },
      datasheet: 'https://www.st.com/resource/en/datasheet/stm32f103c8.pdf'
    },
    {
      id: 'comp2',
      model: 'ESP32-WROOM-32',
      type: 'microcontroller',
      typeName: '主控芯片',
      manufacturer: 'esp',
      manufacturerName: 'Espressif Systems',
      package: 'smd',
      packageName: 'SMD',
      price: 28.50,
      specifications: {
        '核心架构': '双核 Tensilica LX6',
        '主频': '240 MHz',
        'Flash': '4 MB',
        'RAM': '520 KB',
        '工作电压': '3.0V - 3.6V',
        '温度范围': '-40°C to 85°C',
        '无线': 'Wi-Fi 802.11 b/g/n, Bluetooth 4.2'
      },
      datasheet: 'https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf'
    },
    {
      id: 'comp3',
      model: 'Arduino Uno R3',
      type: 'microcontroller',
      typeName: '主控芯片',
      manufacturer: 'arduino',
      manufacturerName: 'Arduino',
      package: 'dip',
      packageName: 'DIP',
      price: 45.00,
      specifications: {
        '核心芯片': 'ATmega328P',
        '主频': '16 MHz',
        'Flash': '32 KB',
        'RAM': '2 KB',
        '工作电压': '5V',
        '数字I/O': '14',
        '模拟输入': '6'
      },
      datasheet: 'https://www.arduino.cc/en/uploads/Main/Arduino_Uno_Rev3-schematic.pdf'
    },
    {
      id: 'comp4',
      model: 'LM35DZ',
      type: 'sensor',
      typeName: '传感器',
      manufacturer: 'ti',
      manufacturerName: 'Texas Instruments',
      package: 'to',
      packageName: 'TO-92',
      price: 3.20,
      specifications: {
        '类型': '温度传感器',
        '温度范围': '0°C to 100°C',
        '精度': '±0.5°C',
        '输出': '线性电压',
        '灵敏度': '10 mV/°C',
        '工作电压': '4V - 30V'
      },
      datasheet: 'https://www.ti.com/lit/ds/symlink/lm35.pdf'
    },
    {
      id: 'comp5',
      model: 'HC-SR04',
      type: 'sensor',
      typeName: '传感器',
      manufacturer: 'nxp',
      manufacturerName: 'NXP Semiconductors',
      package: 'dip',
      packageName: 'DIP',
      price: 8.90,
      specifications: {
        '类型': '超声波测距传感器',
        '测距范围': '2cm - 400cm',
        '精度': '±3mm',
        '工作电压': '5V',
        '接口': 'Trig, Echo, VCC, GND'
      },
      datasheet: 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf'
    },
    {
      id: 'comp6',
      model: '10KΩ 0.25W',
      type: 'resistor',
      typeName: '电阻',
      manufacturer: 'yageo',
      manufacturerName: 'Yageo',
      package: 'smd',
      packageName: '0805',
      price: 0.12,
      specifications: {
        '阻值': '10KΩ',
        '功率': '0.25W',
        '精度': '±5%',
        '温度系数': '±100ppm/°C',
        '工作温度': '-55°C to 155°C'
      },
      datasheet: 'https://www.yageo.com/upload/media/product/product_category/resistor/rc-series.pdf'
    },
    {
      id: 'comp7',
      model: '100nF 50V',
      type: 'capacitor',
      typeName: '电容',
      manufacturer: 'murata',
      manufacturerName: 'Murata Manufacturing',
      package: 'smd',
      packageName: '0805',
      price: 0.08,
      specifications: {
        '容量': '100nF',
        '电压': '50V',
        '精度': '±10%',
        '类型': 'MLCC',
        '温度系数': 'X7R',
        '工作温度': '-55°C to 125°C'
      },
      datasheet: 'https://www.murata.com/en-us/products/productdetail?partno=GRM188R71C104KA35D'
    },
    {
      id: 'comp8',
      model: 'LED-RED-5MM',
      type: 'diode',
      typeName: '二极管',
      manufacturer: 'kingbright',
      manufacturerName: 'Kingbright',
      package: 'dip',
      packageName: '5mm',
      price: 0.50,
      specifications: {
        '颜色': '红色',
        '波长': '620-630nm',
        '正向电压': '1.8V-2.2V',
        '正向电流': '20mA',
        '视角': '20°',
        '封装': '直插5mm'
      },
      datasheet: 'https://www.kingbright.com/attachments/file/psearch/000/00/00/KP-2012EC.pdf'
    },
    {
      id: 'comp9',
      model: '2N2222A',
      type: 'transistor',
      typeName: '三极管',
      manufacturer: 'onsemi',
      manufacturerName: 'ON Semiconductor',
      package: 'to',
      packageName: 'TO-92',
      price: 1.20,
      specifications: {
        '类型': 'NPN',
        '集电极电流': '800mA',
        '集电极-发射极电压': '40V',
        '放大倍数': '100-300',
        '封装': 'TO-92'
      },
      datasheet: 'https://www.onsemi.com/pdf/datasheet/2n2222a-d.pdf'
    },
    {
      id: 'comp10',
      model: 'LM7805',
      type: 'ic',
      typeName: '集成电路',
      manufacturer: 'ti',
      manufacturerName: 'Texas Instruments',
      package: 'to',
      packageName: 'TO-220',
      price: 2.80,
      specifications: {
        '类型': '线性稳压器',
        '输出电压': '5V',
        '输出电流': '1A',
        '输入电压': '7V-35V',
        '封装': 'TO-220'
      },
      datasheet: 'https://www.ti.com/lit/ds/symlink/lm7805.pdf'
    }
  ];

  // 状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([...mockComponents]);
  const [sortField, setSortField] = useState<SortField | ''>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [typeFilter, setTypeFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [componentSearch, setComponentSearch] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showProjectSelectModal, setShowProjectSelectModal] = useState(false);
  const [projectOptions, setProjectOptions] = useState<Project[]>([]);
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [isAddingToProject, setIsAddingToProject] = useState(false);
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; message: string; type: 'default' | 'destructive' | 'success' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'default'
  });

  const showAlert = (message: string, type: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default', title: string = '') => {
    setAlertState({ open: true, title, message, type });
    setTimeout(() => setAlertState(prev => ({ ...prev, open: false })), 3000);
  };

  const totalCount = filteredComponents.length;

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${t('component_db.page_title')} - PCBTool.AI`;
    return () => { document.title = originalTitle; };
  }, [t]);

  // 执行搜索和筛选
  const performSearch = () => {
    let filtered = [...mockComponents];
    
    // 搜索词筛选
    if (componentSearch) {
      const searchTerm = componentSearch.toLowerCase();
      filtered = filtered.filter(component => 
        component.model.toLowerCase().includes(searchTerm) ||
        component.typeName.toLowerCase().includes(searchTerm) ||
        component.manufacturerName.toLowerCase().includes(searchTerm)
      );
    }
    
    // 类型筛选
    if (typeFilter) {
      filtered = filtered.filter(component => component.type === typeFilter);
    }
    
    // 制造商筛选
    if (manufacturerFilter) {
      filtered = filtered.filter(component => component.manufacturer === manufacturerFilter);
    }
    
    // 封装筛选
    if (packageFilter) {
      filtered = filtered.filter(component => component.package === packageFilter);
    }
    
    setFilteredComponents(filtered);
    setCurrentPage(1);
    setSelectedComponents(new Set());
  };

  // 处理搜索框回车
  const handleComponentSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  // 排序表格
  const sortTable = (field: SortField) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
    
    const sorted = [...filteredComponents].sort((a, b) => {
      let aValue: string | number = a[field];
      let bValue: string | number = b[field];
      
      if (field === 'type') {
        aValue = a.typeName;
        bValue = b.typeName;
      } else if (field === 'manufacturer') {
        aValue = a.manufacturerName;
        bValue = b.manufacturerName;
      } else if (field === 'package') {
        aValue = a.packageName;
        bValue = b.packageName;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return newSortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return newSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    setFilteredComponents(sorted);
  };

  // 处理每页条数变化
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value);
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // 切换页面
  const changePage = (pageNum: number) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
  };

  // 处理全选
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const currentPageComponentIds = getCurrentPageComponents().map(component => component.id);
      setSelectedComponents(new Set(currentPageComponentIds));
    } else {
      setSelectedComponents(new Set());
    }
  };

  // 处理单个选择
  const handleComponentSelect = (componentId: string, checked: boolean) => {
    const newSelected = new Set(selectedComponents);
    if (checked) {
      newSelected.add(componentId);
    } else {
      newSelected.delete(componentId);
    }
    setSelectedComponents(newSelected);
  };

  const handleBatchDelete = () => {
    if (selectedComponents.size === 0) return;

    if (confirm(t('component_db.confirm_delete'))) {
      const newComponents = filteredComponents.filter(component => !selectedComponents.has(component.id));
      setFilteredComponents(newComponents);
      setSelectedComponents(new Set());
      showAlert(t('component_db.alert_delete_success'), 'success');
    }
  };

  // 显示元器件详情
  const showComponentDetail = (componentId: string) => {
    const component = mockComponents.find(c => c.id === componentId);
    if (component) {
      setSelectedComponent(component);
      setShowComponentModal(true);
    }
  };

  // 关闭模态框
  const closeModal = () => {
    setShowComponentModal(false);
    setShowProjectSelectModal(false);
    setSelectedComponent(null);
  };

  useEffect(() => {
    if (!showComponentModal) {
      return;
    }

    const nextProjects = listProjects();
    setProjectOptions(nextProjects);
    const preferredProjectId =
      projectIdFromQuery && nextProjects.some((p) => p.id === projectIdFromQuery)
        ? projectIdFromQuery
        : '';
    setTargetProjectId(preferredProjectId);
  }, [showComponentModal, projectIdFromQuery]);

  const mapComponentToModuleId = (component: Component): string | undefined => {
    const model = component.model.toLowerCase();
    if (model.includes('esp32')) return 'mcu_esp32_wroom';
    if (model.includes('bme280')) return 'sensor_bme280';
    return undefined;
  };

  const buildNextRequirementsText = (currentText: string, component: Component): string => {
    const line = `- ${component.model} | ${component.typeName} | ${component.manufacturerName} | ${component.packageName} | ¥${component.price.toFixed(2)}`;
    if (currentText.includes(component.model)) {
      return currentText;
    }

    const title = '【元器件清单】';
    const trimmed = currentText.trimEnd();
    if (!trimmed) {
      return `${title}\n${line}\n`;
    }
    if (!trimmed.includes(title)) {
      return `${trimmed}\n\n${title}\n${line}\n`;
    }
    return `${trimmed}\n${line}\n`;
  };

  const addSelectedComponentToProject = () => {
    if (!selectedComponent) {
      return;
    }
    if (!targetProjectId) {
      showAlert(t('component_db.alert_no_project'), 'warning');
      setTimeout(() => navigate('/project-create'), 1500);
      return;
    }

    const project = getProjectById(targetProjectId);
    if (!project) {
      showAlert(t('component_db.alert_project_not_found'), 'destructive');
      return;
    }

    const existsInProject =
      project.components.some(
        (c) => c.componentId === selectedComponent.id || c.model === selectedComponent.model,
      ) || (project.requirementsText ?? '').includes(selectedComponent.model);
    if (existsInProject) {
      showAlert(t('component_db.alert_already_exists'), 'info');
      setTimeout(() => {
        closeModal();
        navigate(`/project-detail?projectId=${project.id}`);
      }, 1500);
      return;
    }

    setIsAddingToProject(true);
    try {
      const nextWorkflow: Workflow = (() => {
        const moduleId = mapComponentToModuleId(selectedComponent);
        if (!moduleId) {
          return project.workflow;
        }
        const moduleDefinition = getModuleById(MODULE_CATALOG, moduleId);
        if (!moduleDefinition) {
          return project.workflow;
        }
        const alreadyHasModule = project.workflow.nodes.some((n) => n.moduleId === moduleDefinition.id);
        if (alreadyHasModule) {
          return project.workflow;
        }
        const nextIndex = project.workflow.nodes.filter((n) => n.moduleId === moduleDefinition.id).length + 1;
        const node: WorkflowNode = {
          id: createId('node'),
          moduleId: moduleDefinition.id,
          label: `${moduleDefinition.name} #${nextIndex}`,
        };
        return { ...project.workflow, nodes: [...project.workflow.nodes, node] };
      })();

      const nextRequirementsText = buildNextRequirementsText(project.requirementsText ?? '', selectedComponent);
      const nextComponents = [
        ...project.components,
        { componentId: selectedComponent.id, model: selectedComponent.model, addedAtMs: Date.now() },
      ];

      const updated = upsertProjectFromCreateInput(
        {
          name: project.name,
          description: project.description,
          requirementsText: nextRequirementsText,
          coverImageDataUrl: project.coverImageDataUrl,
          workflow: nextWorkflow,
          components: nextComponents,
        },
        project.id,
      );

      showAlert(t('component_db.alert_added_success', { name: updated.name }), 'success');
      setTimeout(() => {
        closeModal();
        navigate(`/project-detail?projectId=${updated.id}`);
      }, 1500);
    } finally {
      setIsAddingToProject(false);
    }
  };

  // 获取当前页的元器件
  const getCurrentPageComponents = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredComponents.length);
    return filteredComponents.slice(startIndex, endIndex);
  };

  // 渲染分页按钮
  const renderPaginationButtons = () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const buttons = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button
            key={i}
            className={`px-3 py-1 border border-border-primary rounded ${styles.paginationButton} ${
              i === currentPage ? styles.paginationActive : ''
            }`}
            onClick={() => changePage(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      buttons.push(
        <button
          key={1}
          className={`px-3 py-1 border border-border-primary rounded ${styles.paginationButton} ${
            1 === currentPage ? styles.paginationActive : ''
          }`}
          onClick={() => changePage(1)}
        >
          1
        </button>
      );
      
      if (currentPage > 4) {
        buttons.push(<span key="ellipsis1" className="px-3 py-1 text-text-secondary">...</span>);
      }
      
      const startPage = Math.max(2, currentPage - 2);
      const endPage = Math.min(totalPages - 1, currentPage + 2);
      
      for (let i = startPage; i <= endPage; i++) {
        buttons.push(
          <button
            key={i}
            className={`px-3 py-1 border border-border-primary rounded ${styles.paginationButton} ${
              i === currentPage ? styles.paginationActive : ''
            }`}
            onClick={() => changePage(i)}
          >
            {i}
          </button>
        );
      }
      
      if (currentPage < totalPages - 3) {
        buttons.push(<span key="ellipsis2" className="px-3 py-1 text-text-secondary">...</span>);
      }
      
      if (totalPages > 1) {
        buttons.push(
          <button
            key={totalPages}
            className={`px-3 py-1 border border-border-primary rounded ${styles.paginationButton} ${
              totalPages === currentPage ? styles.paginationActive : ''
            }`}
            onClick={() => changePage(totalPages)}
          >
            {totalPages}
          </button>
        );
      }
    }
    
    return buttons;
  };

  const currentPageComponents = getCurrentPageComponents();
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AppShell pageTitle="元器件数据库" breadcrumb={['工作台', '知识库', '元器件数据库']}>
      <AnimatedAlert
        open={alertState.open}
        variant={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
      />

      {/* 工具栏区域 */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 搜索框 */}
            <div className="flex-1 lg:max-w-md">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="搜索元器件型号、关键词..." 
                  value={componentSearch}
                  onChange={(e) => setComponentSearch(e.target.value)}
                  onKeyPress={handleComponentSearchKeyPress}
                  className={`w-full pl-10 pr-4 py-3 border border-border-primary rounded-lg ${styles.searchFocus} text-text-primary placeholder-text-secondary`}
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
              </div>
            </div>
              
            {/* 筛选条件 */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-40">
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={[
                    { label: '全部类型', value: '' },
                    { label: '主控芯片', value: 'microcontroller' },
                    { label: '传感器', value: 'sensor' },
                    { label: '电阻', value: 'resistor' },
                    { label: '电容', value: 'capacitor' },
                    { label: '电感', value: 'inductor' },
                    { label: '二极管', value: 'diode' },
                    { label: '三极管', value: 'transistor' },
                    { label: '集成电路', value: 'ic' },
                    { label: '连接器', value: 'connector' },
                  ]}
                  placeholder="全部类型"
                />
              </div>

              <div className="w-48">
                <Select
                  value={manufacturerFilter}
                  onChange={setManufacturerFilter}
                  options={[
                    { label: '全部制造商', value: '' },
                    { label: 'Texas Instruments', value: 'ti' },
                    { label: 'STMicroelectronics', value: 'st' },
                    { label: 'NXP Semiconductors', value: 'nxp' },
                    { label: 'Microchip Technology', value: 'microchip' },
                    { label: 'Arduino', value: 'arduino' },
                    { label: 'Espressif Systems', value: 'esp' },
                    { label: 'Maxim Integrated', value: 'maxim' },
                    { label: 'Analog Devices', value: 'analog' },
                  ]}
                  placeholder="全部制造商"
                />
              </div>

              <div className="w-40">
                <Select
                  value={packageFilter}
                  onChange={setPackageFilter}
                  options={[
                    { label: '全部封装', value: '' },
                    { label: 'DIP', value: 'dip' },
                    { label: 'SMD', value: 'smd' },
                    { label: 'QFP', value: 'qfp' },
                    { label: 'SOIC', value: 'soic' },
                    { label: 'TO', value: 'to' },
                    { label: 'SOP', value: 'sop' },
                    { label: 'BGA', value: 'bga' },
                  ]}
                  placeholder="全部封装"
                />
              </div>
                
              <button 
                onClick={performSearch}
                className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-glow transition-all duration-300"
              >
                <i className="fas fa-search mr-2"></i>
                  搜索
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 内容展示区域 */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* 表格头部 */}
          <div className="p-6 border-b border-border-primary">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">元器件列表</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm text-text-secondary">
                  <input 
                    type="checkbox" 
                    checked={currentPageComponents.length > 0 && selectedComponents.size === currentPageComponents.length}
                    onChange={handleSelectAll}
                    className="rounded border-border-primary"
                  />
                  <span>全选</span>
                </label>
                <button 
                  onClick={handleBatchDelete}
                  disabled={selectedComponents.size === 0}
                  className="px-4 py-2 text-danger border border-danger rounded-lg hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
                >
                  <i className="fas fa-trash mr-2"></i>
                    批量删除
                </button>
              </div>
            </div>
          </div>
            
          {/* 表格内容 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="text-left py-3 px-6 w-12">
                    <input type="checkbox" className="rounded border-border-primary" />
                  </th>
                  <th className="text-left py-3 px-6">
                    <button 
                      onClick={() => sortTable('model')}
                      className={`flex items-center space-x-1 text-text-secondary hover:text-primary ${styles.sortButton} px-2 py-1 rounded ${
                        sortField === 'model' ? (sortOrder === 'asc' ? styles.sortAsc : styles.sortDesc) : ''
                      }`}
                    >
                      <span className="font-medium">元器件型号</span>
                      <i className="fas fa-sort text-xs"></i>
                    </button>
                  </th>
                  <th className="text-left py-3 px-6">
                    <button 
                      onClick={() => sortTable('type')}
                      className={`flex items-center space-x-1 text-text-secondary hover:text-primary ${styles.sortButton} px-2 py-1 rounded ${
                        sortField === 'type' ? (sortOrder === 'asc' ? styles.sortAsc : styles.sortDesc) : ''
                      }`}
                    >
                      <span className="font-medium">类型</span>
                      <i className="fas fa-sort text-xs"></i>
                    </button>
                  </th>
                  <th className="text-left py-3 px-6">
                    <button 
                      onClick={() => sortTable('manufacturer')}
                      className={`flex items-center space-x-1 text-text-secondary hover:text-primary ${styles.sortButton} px-2 py-1 rounded ${
                        sortField === 'manufacturer' ? (sortOrder === 'asc' ? styles.sortAsc : styles.sortDesc) : ''
                      }`}
                    >
                      <span className="font-medium">制造商</span>
                      <i className="fas fa-sort text-xs"></i>
                    </button>
                  </th>
                  <th className="text-left py-3 px-6">
                    <button 
                      onClick={() => sortTable('package')}
                      className={`flex items-center space-x-1 text-text-secondary hover:text-primary ${styles.sortButton} px-2 py-1 rounded ${
                        sortField === 'package' ? (sortOrder === 'asc' ? styles.sortAsc : styles.sortDesc) : ''
                      }`}
                    >
                      <span className="font-medium">封装</span>
                      <i className="fas fa-sort text-xs"></i>
                    </button>
                  </th>
                  <th className="text-left py-3 px-6">
                    <button 
                      onClick={() => sortTable('price')}
                      className={`flex items-center space-x-1 text-text-secondary hover:text-primary ${styles.sortButton} px-2 py-1 rounded ${
                        sortField === 'price' ? (sortOrder === 'asc' ? styles.sortAsc : styles.sortDesc) : ''
                      }`}
                    >
                      <span className="font-medium">单价(¥)</span>
                      <i className="fas fa-sort text-xs"></i>
                    </button>
                  </th>
                  <th className="text-left py-3 px-6 w-20">
                    <span className="font-medium text-text-secondary">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {currentPageComponents.map(component => (
                  <tr key={component.id} className={styles.tableRow}>
                    <td className="py-4 px-6">
                      <input 
                        type="checkbox" 
                        checked={selectedComponents.has(component.id)}
                        onChange={(e) => handleComponentSelect(component.id, e.target.checked)}
                        className="rounded border-border-primary"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => showComponentDetail(component.id)}
                        className="text-primary hover:text-secondary font-medium text-left"
                      >
                        {component.model}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-sm font-medium">
                        {component.typeName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-text-primary">{component.manufacturerName}</td>
                    <td className="py-4 px-6 text-text-primary">{component.packageName}</td>
                    <td className="py-4 px-6 text-text-primary font-medium">{component.price.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => showComponentDetail(component.id)}
                          className="text-primary hover:text-secondary transition-colors" 
                          title="查看详情"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            
          {/* 空状态 */}
          {filteredComponents.length === 0 && (
            <div className="text-center py-16">
              <i className="fas fa-search text-6xl text-text-secondary mb-4"></i>
              <h3 className="text-lg font-medium text-text-primary mb-2">未找到相关元器件</h3>
              <p className="text-text-secondary">请尝试调整搜索条件或关键词</p>
            </div>
          )}
        </div>
      </section>

      {/* 分页区域 */}
      <section>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* 显示信息 */}
            <div className="text-sm text-text-secondary">
                显示 <span>{totalCount > 0 ? startIndex : 0}</span> - <span>{endIndex}</span> 条，共 <span>{totalCount.toLocaleString()}</span> 条记录
            </div>
              
            {/* 每页条数选择 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">每页显示</span>
              <div className="w-20">
                <Select
                  value={pageSize.toString()}
                  onChange={handlePageSizeChange}
                  options={[
                    { label: '10', value: '10' },
                    { label: '20', value: '20' },
                    { label: '50', value: '50' },
                    { label: '100', value: '100' },
                  ]}
                  placeholder="10"
                />
              </div>
              <span className="text-sm text-text-secondary">条</span>
            </div>
              
            {/* 分页按钮 */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 border border-border-primary rounded ${styles.paginationButton} disabled:opacity-50`}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="flex items-center space-x-1">
                {renderPaginationButtons()}
              </div>
              <button 
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1 border border-border-primary rounded ${styles.paginationButton} disabled:opacity-50`}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* 元器件详情模态框 */}
      {showComponentModal && selectedComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* 模态框头部 */}
              <div className="p-6 border-b border-border-primary">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-text-primary">{selectedComponent.model}</h3>
                  <button 
                    onClick={closeModal}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <i className="fas fa-times text-lg"></i>
                  </button>
                </div>
              </div>
              
              {/* 模态框内容 */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 基本信息 */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-text-primary border-b border-border-primary pb-2">基本信息</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">元器件型号:</span>
                        <span className="text-text-primary font-medium">{selectedComponent.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">类型:</span>
                        <span className="text-text-primary">{selectedComponent.typeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">制造商:</span>
                        <span className="text-text-primary">{selectedComponent.manufacturerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">封装:</span>
                        <span className="text-text-primary">{selectedComponent.packageName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">单价:</span>
                        <span className="text-primary font-bold text-lg">¥{selectedComponent.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 技术规格 */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-text-primary border-b border-border-primary pb-2">技术规格</h4>
                    <div className="bg-bg-secondary rounded-lg p-4">
                      {Object.entries(selectedComponent.specifications).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-4 py-2 border-b border-border-primary last:border-b-0">
                          <span className="text-text-secondary font-medium">{key}</span>
                          <span className="text-text-primary">{value}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* 数据手册 */}
                    {selectedComponent.datasheet && (
                      <div className="pt-4 border-t border-border-primary">
                        <a 
                          href={selectedComponent.datasheet} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
                        >
                          <i className="fas fa-file-pdf"></i>
                          <span>查看数据手册 (PDF)</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 模态框底部 */}
              <div className="p-6 border-t border-border-primary">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-border-primary rounded-lg text-text-secondary hover:bg-bg-secondary transition-colors"
                  >
                    关闭
                  </button>
                  {projectOptions.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        navigate('/project-create');
                      }}
                      className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all duration-300"
                    >
                      去创建项目
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowProjectSelectModal(true)}
                      className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all duration-300"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      添加到项目
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 项目选择模态框 */}
      {showProjectSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-card max-w-md w-full overflow-hidden">
              <div className="p-6 border-b border-border-primary">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-text-primary">选择项目</h3>
                  <button 
                    onClick={() => setShowProjectSelectModal(false)}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <i className="fas fa-times text-lg"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary">请选择要将 <strong>{selectedComponent?.model}</strong> 添加到的项目：</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {projectOptions.map((p) => (
                      <label 
                        key={p.id}
                        className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          targetProjectId === p.id 
                            ? 'border-primary bg-primary bg-opacity-5' 
                            : 'border-border-primary hover:border-primary hover:bg-bg-secondary'
                        }`}
                      >
                        <input 
                          type="radio"
                          name="targetProject"
                          value={p.id}
                          checked={targetProjectId === p.id}
                          onChange={(e) => setTargetProjectId(e.target.value)}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          targetProjectId === p.id ? 'border-primary' : 'border-border-primary'
                        }`}>
                          {targetProjectId === p.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-text-primary truncate">{p.name}</div>
                          <div className="text-xs text-text-secondary truncate">{p.description || '无描述'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border-primary flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProjectSelectModal(false)}
                  className="px-6 py-2 border border-border-primary rounded-lg text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!targetProjectId || isAddingToProject}
                  onClick={addSelectedComponentToProject}
                  className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                >
                  {isAddingToProject ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      添加中...
                    </>
                  ) : (
                    <>
                      确认添加
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ComponentDatabase;
