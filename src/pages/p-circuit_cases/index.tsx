

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/AppShell';
import { Select } from '../../components/ui/select';
import { createEmptyWorkflow, createId, getModuleById } from '../../domain/workflow';
import { MODULE_CATALOG } from '../../domain/moduleCatalog';
import { upsertProjectFromCreateInput, setProjectStatus } from '../../lib/projectsStore';
import styles from './styles.module.css';
import { CaseData, CaseDatabase } from './types';

const CircuitCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State
  const [caseSearchValue, setCaseSearchValue] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [complexityFilter, setComplexityFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCaseData, setSelectedCaseData] = useState<CaseData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Page title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${t('circuit_cases.page_title')} - PCBTool.AI`;
    return () => { document.title = originalTitle; };
  }, [t]);

  // Case database
  const caseDatabase: CaseDatabase = {
    'case-001': {
      id: 'case-001',
      name: 'Arduino Smart Home Controller',
      application: 'IoT',
      complexity: 'Simple',
      description: 'Arduino Uno-based smart home control solution supporting light control, curtain control, temperature monitoring and remote control. Modular design, easy to expand.',
      image: 'https://s.coze.cn/image/RRDWKbOoqjk/',
      date: '2024-01-15',
      views: '1,234',
      components: [
        { name: 'Arduino Uno', type: 'MCU' },
        { name: 'ESP8266', type: 'WiFi Module' },
        { name: 'Relay Module', type: 'Actuator' },
        { name: 'DHT11', type: 'Temp/Humidity Sensor' }
      ],
      files: [
        { name: 'Schematic.pdf', size: '2.3 MB' },
        { name: 'PCB_Layout.kicad_pcb', size: '1.8 MB' },
        { name: 'Source_Code.ino', size: '15 KB' },
        { name: 'BOM_List.xlsx', size: '8 KB' }
      ]
    },
    'case-002': {
      id: 'case-002',
      name: 'STM32 Industrial Controller',
      application: 'Industrial',
      complexity: 'Medium',
      description: 'High-performance industrial control solution based on STM32F4, supporting multiple sensor interfaces and communication protocols. Designed for harsh industrial environments.',
      image: 'https://s.coze.cn/image/5p-8fubtpbU/',
      date: '2024-01-12',
      views: '856',
      components: [
        { name: 'STM32F407', type: 'MCU' },
        { name: 'RS485模块', type: 'Comm Interface' },
        { name: 'ADC模块', type: 'Analog Input' },
        { name: 'DAC模块', type: 'Analog Output' }
      ],
      files: [
        { name: 'Schematic.pdf', size: '4.1 MB' },
        { name: 'PCB_Layout.altium', size: '3.2 MB' },
        { name: 'Firmware.zip', size: '120 KB' },
        { name: 'User_Manual.pdf', size: '1.5 MB' }
      ]
    },
    'case-003': {
      id: 'case-003',
      name: 'ESP32 Environment Monitor',
      application: 'IoT',
      complexity: 'Simple',
      description: 'Low-power IoT environment monitoring device supporting temperature, humidity, PM2.5, and light sensors',
      image: 'https://s.coze.cn/image/oM1GUrRi33Q/',
      date: '2024-01-10',
      views: '678',
      components: [
        { name: 'ESP32', type: 'MCU' },
        { name: 'BME280', type: 'Temp/Humidity Sensor' },
        { name: 'PMS5003', type: 'PM2.5 Sensor' },
        { name: 'BH1750', type: 'Light Sensor' }
      ],
      files: [
        { name: 'Schematic.pdf', size: '1.8 MB' },
        { name: 'PCB_Layout.kicad_pcb', size: '1.5 MB' },
        { name: 'Source_Code.zip', size: '25 KB' },
        { name: 'BOM_List.xlsx', size: '7 KB' }
      ]
    },
    'case-004': {
      id: 'case-004',
      name: 'Li-Battery Charge Manager',
      application: 'Power Mgmt',
      complexity: 'Simple',
      description: 'Safe and reliable lithium battery charging solution supporting multiple battery types and protection features',
      image: 'https://s.coze.cn/image/2iFNEpdW_Xw/',
      date: '2024-01-08',
      views: '456',
      components: [
        { name: 'TP4056', type: 'Charge IC' },
        { name: 'DW01', type: 'Protection IC' },
        { name: 'FS8205A', type: 'MOSFET' },
        { name: 'LED Indicator', type: 'Status Indicator' }
      ],
      files: [
        { name: 'Schematic.pdf', size: '1.2 MB' },
        { name: 'PCB_Layout.kicad_pcb', size: '950 KB' },
        { name: 'BOM_List.xlsx', size: '5 KB' }
      ]
    },
    'case-005': {
      id: 'case-005',
      name: 'Automotive CAN Bus Module',
      application: 'Automotive',
      complexity: 'Complex',
      description: 'Automotive-grade CAN bus communication solution with high-reliability data transmission',
      image: 'https://s.coze.cn/image/8y0nYPPQxNo/',
      date: '2024-01-05',
      views: '923',
      components: [
        { name: 'STM32F103', type: 'MCU' },
        { name: 'MCP2551', type: 'CAN Transceiver' },
        { name: 'TJA1050', type: 'CAN Controller' },
        { name: 'TVS Diode', type: 'Protection' }
      ],
      files: [
        { name: 'Schematic.pdf', size: '3.5 MB' },
        { name: 'PCB_Layout.altium', size: '2.8 MB' },
        { name: 'Firmware_Source.zip', size: '85 KB' },
        { name: 'Test_Report.pdf', size: '2.1 MB' }
      ]
    },
    'case-006': {
      id: 'case-006',
      name: 'Heart Rate Medical Device',
      application: 'Medical',
      complexity: 'Medium',
      description: 'High-precision medical-grade heart rate monitoring solution, compliant with medical certification standards',
      image: 'https://s.coze.cn/image/bcwJhe-QiNo/',
      date: '2024-01-03',
      views: '745',
      components: [
        { name: 'MAX30102', type: 'Heart Rate Sensor' },
        { name: 'nRF52832', type: 'BLE MCU' },
        { name: 'LIS2DH12', type: 'Accelerometer' },
        { name: 'CR2032', type: 'Battery' }
      ],
      files: [
        { name: 'Schematic.pdf', size: '2.7 MB' },
        { name: 'PCB_Layout.kicad_pcb', size: '2.1 MB' },
        { name: 'Firmware_Source.zip', size: '65 KB' },
        { name: 'Medical_Cert_Report.pdf', size: '4.2 MB' }
      ]
    },
    'case-007': {
      id: 'case-007',
      name: 'Bluetooth Audio Amplifier',
      application: 'Consumer',
      complexity: 'Simple',
      description: 'Hi-fi Bluetooth speaker solution with multi-format audio support and DSP effects processing',
      image: 'https://s.coze.cn/image/JOHE_y8-OLg/',
      date: '2024-01-01',
      views: '1,123',
      components: [
        { name: 'CSR8675', type: 'BT Chip' },
        { name: 'TPA3116D2', type: 'Amplifier IC' },
        { name: 'NE5532', type: 'Op-Amp IC' },
        { name: 'RC Filter', type: 'Audio DSP' }
      ],
      files: [
        { name: 'Schematic.pdf', size: '2.2 MB' },
        { name: 'PCB_Layout.altium', size: '1.8 MB' },
        { name: 'Firmware_Source.zip', size: '45 KB' },
        { name: 'BOM_List.xlsx', size: '6 KB' }
      ]
    },
    'case-008': {
      id: 'case-008',
      name: 'PLC Control Module',
      application: 'Industrial',
      complexity: 'Complex',
      description: 'Industrial PLC control solution with multiple I/O interfaces and communication protocols',
      image: 'https://s.coze.cn/image/BHLiWf1QxIk/',
      date: '2023-12-28',
      views: '654',
      components: [
        { name: 'S7-1200', type: 'PLC Controller' },
        { name: 'SM 1223', type: 'Digital I/O Module' },
        { name: 'SM 1231', type: 'Analog Input Module' },
        { name: 'SM 1232', type: 'Analog Output Module' }
      ],
      files: [
        { name: 'System_Config.pdf', size: '3.8 MB' },
        { name: 'Ladder_Program.zip', size: '120 KB' },
        { name: 'User_Manual.pdf', size: '2.5 MB' },
        { name: 'Wiring_Diagram.pdf', size: '1.8 MB' }
      ]
    }
  };

  // Application domain class
  const getApplicationClass = (application: string): string => {
    const classes: { [key: string]: string } = {
      'IoT': 'px-2 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-xs font-medium',
      'Industrial': 'px-2 py-1 bg-warning bg-opacity-10 text-warning rounded-full text-xs font-medium',
      'Automotive': 'px-2 py-1 bg-danger bg-opacity-10 text-danger rounded-full text-xs font-medium',
      'Medical': 'px-2 py-1 bg-secondary bg-opacity-10 text-secondary rounded-full text-xs font-medium',
      'Consumer': 'px-2 py-1 bg-info bg-opacity-10 text-info rounded-full text-xs font-medium',
      'Power Mgmt': 'px-2 py-1 bg-tertiary bg-opacity-10 text-tertiary rounded-full text-xs font-medium'
    };
    return classes[application] || 'px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium';
  };

  // Complexity class
  const getComplexityClass = (complexity: string): string => {
    const classes: { [key: string]: string } = {
      'Simple': 'px-2 py-1 bg-success bg-opacity-10 text-success rounded-full text-xs font-medium',
      'Medium': 'px-2 py-1 bg-warning bg-opacity-10 text-warning rounded-full text-xs font-medium',
      'Complex': 'px-2 py-1 bg-danger bg-opacity-10 text-danger rounded-full text-xs font-medium'
    };
    return classes[complexity] || 'px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium';
  };

  // Search handler
  const handleCaseSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const performSearch = () => {
    const searchTerm = caseSearchValue.trim();
    
    console.log('Search cases:', {
      searchTerm,
      applicationFilter,
      complexityFilter
    });
    
    setIsSearching(true);
    
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  };

  // Card click handler
  const handleCaseCardClick = (caseId: string) => {
    const caseData = caseDatabase[caseId];
    if (caseData) {
      setSelectedCaseData(caseData);
      setIsModalVisible(true);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedCaseData(null);
  };

  // Apply case to project
  const handleUseCase = () => {
    if (!selectedCaseData) return;
    
    // Create project from case
    const workflow = createEmptyWorkflow();
    
    // Add USB power by default
    const powerModule = getModuleById(MODULE_CATALOG, 'power_usb_5v');
    if (powerModule) {
      workflow.nodes.push({
        id: createId('node'),
        moduleId: powerModule.id,
        label: 'USB Power',
      });
    }

    // Add ESP32 if applicable
    if (selectedCaseData.name.includes('ESP32') || selectedCaseData.components.some(c => c.name.includes('ESP32'))) {
      const mcu = getModuleById(MODULE_CATALOG, 'mcu_esp32_wroom');
      if (mcu) {
        workflow.nodes.push({
          id: createId('node'),
          moduleId: mcu.id,
          label: 'ESP32 MCU',
        });
      }
         
      // Add BME280 if present
      if (selectedCaseData.components.some(c => c.name.includes('BME280') || c.name.includes('temp/humidity'))) {
        const sensor = getModuleById(MODULE_CATALOG, 'sensor_bme280');
        if (sensor) {
          workflow.nodes.push({
            id: createId('node'),
            moduleId: sensor.id,
            label: 'BME280 Sensor',
          });
        }
      }
    }

    const project = upsertProjectFromCreateInput({
      name: `${selectedCaseData.name} (Copy)`,
      description: `Based on case "${selectedCaseData.name}" - created project。\n${selectedCaseData.description}`,
      requirementsText: selectedCaseData.description,
      coverImageDataUrl: selectedCaseData.image,
      workflow: workflow,
    });
    
    setProjectStatus(project.id, 'draft');
    
    handleCloseModal();
    navigate(`/project-create?projectId=${project.id}`);
  };

  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  // Render case card
  const renderCaseCard = (caseData: CaseData) => (
    <div
      key={caseData.id}
      className={`${styles.caseCard} bg-gradient-card rounded-xl p-6 shadow-card`}
      onClick={() => handleCaseCardClick(caseData.id)}
    >
      <div className="mb-4">
        <img
          src={caseData.image}
          alt={caseData.name}
          className="w-full h-32 object-cover rounded-lg"
          loading="lazy"
        />
      </div>
      <h4 className="font-semibold text-text-primary mb-2">{caseData.name}</h4>
      <p className="text-sm text-text-secondary mb-3 line-clamp-2">{caseData.description}</p>
      <div className="flex items-center justify-between mb-3">
        <span className={getApplicationClass(caseData.application)}>{caseData.application}</span>
        <span className={getComplexityClass(caseData.complexity)}>{caseData.complexity}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span><i className="fas fa-calendar mr-1"></i>{caseData.date}</span>
        <span><i className="fas fa-eye mr-1"></i>{caseData.views} views</span>
      </div>
    </div>
  );

  return (
    <AppShell pageTitle={t('circuit_cases.page_title')} breadcrumb={[t('circuit_cases.breadcrumb_home'), t('circuit_cases.breadcrumb_knowledge'), t('circuit_cases.breadcrumb_cases')]}>
      <>

        {/* Toolbar */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={caseSearchValue}
                    onChange={(e) => setCaseSearchValue(e.target.value)}
                    onKeyPress={handleCaseSearchKeyPress}
                    placeholder={t('circuit_cases.search_placeholder')}
                    className={`w-full pl-10 pr-4 py-3 border border-border-primary rounded-lg ${styles.searchFocus} text-text-primary placeholder-text-secondary`}
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Domain filter */}
                <div className="w-40">
                  <Select
                    value={applicationFilter}
                    onChange={setApplicationFilter}
                    options={[
                      { label: t('circuit_cases.filter_all_fields'), value: '' },
                      { label: t('circuit_cases.filter_consumer'), value: 'consumer' },
                      { label: t('circuit_cases.filter_industrial'), value: 'industrial' },
                      { label: t('circuit_cases.filter_automotive'), value: 'automotive' },
                      { label: t('circuit_cases.filter_medical'), value: 'medical' },
                      { label: t('circuit_cases.filter_iot'), value: 'iot' },
                      { label: t('circuit_cases.filter_power'), value: 'power' },
                    ]}
                    placeholder={t('circuit_cases.filter_all_fields')}
                  />
                </div>

                {/* Complexity filter */}
                <div className="w-40">
                  <Select
                    value={complexityFilter}
                    onChange={setComplexityFilter}
                    options={[
                      { label: t('circuit_cases.filter_all_complexity'), value: '' },
                      { label: t('circuit_cases.filter_simple'), value: 'simple' },
                      { label: t('circuit_cases.filter_medium'), value: 'medium' },
                      { label: t('circuit_cases.filter_complex'), value: 'complex' },
                    ]}
                    placeholder={t('circuit_cases.filter_all_complexity')}
                  />
                </div>

                {/* Search btn */}
                <button
                  onClick={performSearch}
                  disabled={isSearching}
                  className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                >
                  <i className={`fas ${isSearching ? 'fa-spinner fa-spin' : 'fa-search'} mr-2`}></i>
                  {isSearching ? t('circuit_cases.btn_searching') : t('circuit_cases.btn_search')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Case list */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card">
            {/* Stats */}
            <div className="p-6 border-b border-border-primary">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">{t('circuit_cases.cases_title')}</h3>
                <div className="text-sm text-text-secondary">
                  {Object.keys(caseDatabase).length} cases
                </div>
              </div>
            </div>
            
            {/* Card grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.values(caseDatabase).map(renderCaseCard)}
              </div>
            </div>
            
            {/* Pagination */}
            <div className="p-6 border-t border-border-primary">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                {/* Info */}
                <div className="text-sm text-text-secondary">
                  {t('circuit_cases.pagination_showing', { start: '1', end: '8', total: '12,345' })}
                </div>
                
                {/* Pagination controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`${styles.paginationButton} px-3 py-2 border border-border-primary rounded-lg text-text-secondary ${currentPage === 1 ? 'disabled' : ''}`}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      className={`${styles.paginationButton} px-3 py-2 border border-border-primary rounded-lg text-text-primary ${currentPage === 1 ? 'active' : ''}`}
                    >
                      1
                    </button>
                    <button
                      onClick={() => handlePageChange(2)}
                      className={`${styles.paginationButton} px-3 py-2 border border-border-primary rounded-lg text-text-secondary ${currentPage === 2 ? 'active' : ''}`}
                    >
                      2
                    </button>
                    <button
                      onClick={() => handlePageChange(3)}
                      className={`${styles.paginationButton} px-3 py-2 border border-border-primary rounded-lg text-text-secondary ${currentPage === 3 ? 'active' : ''}`}
                    >
                      3
                    </button>
                    <span className="px-3 py-2 text-text-secondary">...</span>
                    <button
                      onClick={() => handlePageChange(1544)}
                      className={`${styles.paginationButton} px-3 py-2 border border-border-primary rounded-lg text-text-secondary ${currentPage === 1544 ? 'active' : ''}`}
                    >
                      1544
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`${styles.paginationButton} px-3 py-2 border border-border-primary rounded-lg text-text-secondary`}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                
                {/* Page size */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-secondary">{t('circuit_cases.pagination_per_page')}</span>
                  <div className="w-20">
                    <Select
                      value={pageSize.toString()}
                      onChange={handlePageSizeChange}
                      options={[
                        { label: '8', value: '8' },
                        { label: '16', value: '16' },
                        { label: '32', value: '32' },
                        { label: '64', value: '64' },
                      ]}
                      placeholder="8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Case detail modal */}
        {isModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleCloseModal}>
            <div className="flex items-center justify-center min-h-screen p-4">
              <div
                className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between p-6 border-b border-border-primary">
                  <h3 className="text-xl font-semibold text-text-primary">{t('circuit_cases.modal_title')}</h3>
                  <button onClick={handleCloseModal} className="text-text-secondary hover:text-text-primary transition-colors">
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                {/* Modal content */}
                <div className="p-6">
                  {selectedCaseData ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-text-primary mb-2">{t('circuit_cases.modal_case_name')}</h4>
                        <p className="text-text-secondary">{selectedCaseData.name}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-text-primary mb-2">{t('circuit_cases.modal_application')}</h4>
                        <span className={getApplicationClass(selectedCaseData.application)}>{selectedCaseData.application}</span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-text-primary mb-2">{t('circuit_cases.modal_complexity')}</h4>
                        <span className={getComplexityClass(selectedCaseData.complexity)}>{selectedCaseData.complexity}</span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-text-primary mb-2">{t('circuit_cases.modal_description')}</h4>
                        <p className="text-text-secondary leading-relaxed">{selectedCaseData.description}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-text-primary mb-2">{t('circuit_cases.modal_components')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedCaseData.components.map((component, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-bg-secondary rounded-lg">
                              <i className="fas fa-microchip text-primary"></i>
                              <div>
                                <div className="font-medium text-text-primary">{component.name}</div>
                                <div className="text-sm text-text-secondary">{component.type}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-text-primary mb-2">{t('circuit_cases.modal_files')}</h4>
                        <div className="space-y-2">
                          {selectedCaseData.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-border-primary rounded-lg">
                              <div className="flex items-center space-x-3">
                                <i className="fas fa-file-alt text-primary"></i>
                                <div>
                                  <div className="font-medium text-text-primary">{file.name}</div>
                                  <div className="text-sm text-text-secondary">{file.size}</div>
                                </div>
                              </div>
                              <button className="text-primary hover:text-secondary transition-colors">
                                <i className="fas fa-download"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                      <p className="text-text-secondary">{t('circuit_cases.modal_loading')}</p>
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-border-primary">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-border-primary rounded-lg text-text-secondary hover:bg-bg-secondary transition-colors"
                  >
                  {t('circuit_cases.btn_close')}
                  </button>
                  <button
                    onClick={handleUseCase}
                    className="bg-gradient-primary text-white px-6 py-2 rounded-lg font-medium hover:shadow-glow transition-all duration-300"
                  >
                    <i className="fas fa-plus mr-2"></i>
                  {t('circuit_cases.btn_apply')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </AppShell>
  );
};

export default CircuitCasesPage;
