

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/AppShell';
import { Select } from '../../components/ui/select';
import { MODULE_CATALOG } from '../../domain/moduleCatalog';
import {
  Workflow,
  WorkflowConnection,
  WorkflowNode,
  createEmptyWorkflow,
  createId,
  getModuleById,
  validateWorkflow,
} from '../../domain/workflow';
import WorkflowGraph from '../../components/WorkflowGraph';
import CircuitSketchAnalyzer, { SketchAnalysisResult } from '../../components/CircuitSketchAnalyzer';
import { getProjectById, setProjectStatus, upsertProjectFromCreateInput } from '../../lib/projectsStore';
import { callGemini, SMART_GENERATE_SCHEMA } from '../../lib/gemini';
import { loadAiConfig } from '../../lib/storage';
import styles from './styles.module.css';

interface ProjectFormData {
  projectName: string;
  projectDescription: string;
  textRequirements: string;
}

const ProjectCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromQuery = searchParams.get('projectId') ?? undefined;
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    projectDescription: '',
    textRequirements: ''
  });
  const [coverImageDataUrl, setCoverImageDataUrl] = useState<string | undefined>(undefined);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workflow, setWorkflow] = useState<Workflow>(() => createEmptyWorkflow());
  const [moduleToAdd, setModuleToAdd] = useState<string>(MODULE_CATALOG[0]?.id ?? '');
  const [pendingConnection, setPendingConnection] = useState<{
    fromNodeId: string;
    fromPortId: string;
    toNodeId: string;
    toPortId: string;
  }>({ fromNodeId: '', fromPortId: '', toNodeId: '', toPortId: '' });

  const [, setAlertState] = useState<{ open: boolean; title: string; message: string; type: 'default' | 'destructive' | 'success' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'default'
  });

  const [smartPrompt, setSmartPrompt] = useState('');
  const [isSmartGenerating, setIsSmartGenerating] = useState(false);

  const showAlert = (message: string, type: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default', title: string = '') => {
    setAlertState({ open: true, title, message, type });
    setTimeout(() => setAlertState(prev => ({ ...prev, open: false })), 3000);
  };

  // Handle sketch analysis result from CircuitSketchAnalyzer
  const handleSketchAnalysis = (result: SketchAnalysisResult) => {
    setFormData({
      projectName: result.projectName || formData.projectName,
      projectDescription: result.description || formData.projectDescription,
      textRequirements: result.requirementsText || formData.textRequirements,
    });

    // Convert analysis modules to workflow nodes
    const newNodes: WorkflowNode[] = result.modules.map((mod) => ({
      id: createId('node'),
      moduleId: mod.id,
      label: mod.name,
    }));

    // Build a map from analysis module IDs to workflow node IDs
    const idMap = new Map<string, string>();
    result.modules.forEach((mod, i) => {
      idMap.set(mod.id, newNodes[i].id);
    });

    const newConnections: WorkflowConnection[] = result.connections
      .filter((c) => idMap.has(c.fromModuleId) && idMap.has(c.toModuleId))
      .map((c) => ({
        id: createId('conn'),
        from: { nodeId: idMap.get(c.fromModuleId)!, portId: c.type },
        to: { nodeId: idMap.get(c.toModuleId)!, portId: c.type },
      }));

    setWorkflow({ nodes: newNodes, connections: newConnections });
    showAlert('Sketch analyzed successfully! Modules and connections generated.', 'success');
  };

  // Smart generate: one-liner to full project
  const handleSmartGenerate = async () => {
    if (!smartPrompt.trim()) return;

    const config = loadAiConfig();
    if (!config?.apiKey) {
      showAlert('Please configure your Gemini API key in Settings first', 'destructive');
      return;
    }

    setIsSmartGenerating(true);
    try {
      const result = await callGemini({
        apiKey: config.apiKey,
        model: config.model || 'gemini-3-flash-preview',
        systemPrompt: 'You are an expert circuit/PCB design engineer. Given a brief project idea, generate a complete project specification with name, description, detailed requirements, circuit modules (with categories: power, mcu, sensor, interface, glue, other), and connections between them. Use unique IDs for modules (e.g. mod_power_1).',
        userPrompt: `Project idea: ${smartPrompt.trim()}`,
        temperature: 0.3,
        jsonSchema: SMART_GENERATE_SCHEMA,
      });

      const parsed = JSON.parse(result);
      setFormData({
        projectName: parsed.projectName || '',
        projectDescription: parsed.description || '',
        textRequirements: parsed.requirementsText || '',
      });

      // Convert to workflow
      const newNodes: WorkflowNode[] = (parsed.modules || []).map((mod: { id: string; name: string }) => ({
        id: createId('node'),
        moduleId: mod.id,
        label: mod.name,
      }));

      const idMap = new Map<string, string>();
      (parsed.modules || []).forEach((mod: { id: string }, i: number) => {
        idMap.set(mod.id, newNodes[i].id);
      });

      const newConnections: WorkflowConnection[] = (parsed.connections || [])
        .filter((c: { fromModuleId: string; toModuleId: string }) => idMap.has(c.fromModuleId) && idMap.has(c.toModuleId))
        .map((c: { fromModuleId: string; toModuleId: string; type: string }) => ({
          id: createId('conn'),
          from: { nodeId: idMap.get(c.fromModuleId)!, portId: c.type },
          to: { nodeId: idMap.get(c.toModuleId)!, portId: c.type },
        }));

      setWorkflow({ nodes: newNodes, connections: newConnections });
      setSmartPrompt('');
      showAlert('Project generated from your idea!', 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Generation failed', 'destructive');
    } finally {
      setIsSmartGenerating(false);
    }
  };

  // 校验当前正在选择的连接是否有效
  const pendingConnectionIssues = useMemo(() => {
    if (!pendingConnection.fromNodeId || !pendingConnection.fromPortId || !pendingConnection.toNodeId || !pendingConnection.toPortId) {
      return [];
    }
    // 构造一个临时的连接对象进行校验
    const tempConnection: WorkflowConnection = {
      id: 'temp',
      from: { nodeId: pendingConnection.fromNodeId, portId: pendingConnection.fromPortId },
      to: { nodeId: pendingConnection.toNodeId, portId: pendingConnection.toPortId },
    };
    // 这里我们复用 validateWorkflow，但只针对这个临时连接
    // 更好的做法是将 validateWorkflow 中的单条连接校验逻辑抽取出来，这里为了 MVP 简单起见，我们直接构造一个包含该连接的临时 workflow
    const tempWorkflow: Workflow = {
      nodes: workflow.nodes,
      connections: [tempConnection]
    };
    const issues = validateWorkflow(tempWorkflow, MODULE_CATALOG);
    return issues.filter(i => i.connectionId === 'temp');
  }, [pendingConnection, workflow.nodes]);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${t(isEditMode ? 'project_create.title_edit' : 'project_create.title_create')} - PCBTool.AI`;
    return () => { document.title = originalTitle; };
  }, [t, isEditMode]);

  // 检查是否为编辑模式并加载数据
  useEffect(() => {
    if (!projectIdFromQuery) {
      setIsEditMode(false);
      return;
    }
    const project = getProjectById(projectIdFromQuery);
    if (!project) {
      setIsEditMode(false);
      return;
    }
    setIsEditMode(true);
    setFormData({
      projectName: project.name,
      projectDescription: project.description,
      textRequirements: project.requirementsText,
    });
    setCoverImageDataUrl(project.coverImageDataUrl);
    setWorkflow(project.workflow);
  }, [projectIdFromQuery]);

  const validateForm = (): boolean => {
    if (!formData.projectName.trim()) {
      showAlert(t('project_create.error_name_required'), 'destructive');
      return false;
    }

    if (!formData.textRequirements.trim()) {
      showAlert(t('project_create.error_requirements_required'), 'destructive');
      return false;
    }

    return true;
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showAlert(t('project_create.error_file_size'), 'destructive');
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error(t('project_create.error_file_read')));
      reader.readAsDataURL(file);
    });
    setCoverImageDataUrl(dataUrl);
  };

  const handleUploadAreaClick = () => {
    if (!coverImageDataUrl && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleFileUpload(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverImageDataUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    if (confirm(t('project_create.confirm_cancel'))) {
      navigate('/project-list');
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    
    setIsSavingDraft(true);

    const project = upsertProjectFromCreateInput(
      {
        name: formData.projectName,
        description: formData.projectDescription,
        requirementsText: formData.textRequirements,
        coverImageDataUrl,
        workflow,
      },
      projectIdFromQuery,
    );
    setProjectStatus(project.id, 'draft');

    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsSavingDraft(false);
    showAlert(t('project_create.success_draft'), 'success');
  };

  const handleStartGenerate = () => {
    if (!validateForm()) return;

    const project = upsertProjectFromCreateInput(
      {
        name: formData.projectName,
        description: formData.projectDescription,
        requirementsText: formData.textRequirements,
        coverImageDataUrl,
        workflow,
      },
      projectIdFromQuery,
    );
    setProjectStatus(project.id, 'generating');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(`pcbtool.auto-generate.${project.id}`);
    }
    navigate(`/project-detail?projectId=${project.id}&action=generate`);
  };

  const workflowIssues = useMemo(() => validateWorkflow(workflow, MODULE_CATALOG), [workflow]);
  const hasWorkflowErrors = workflowIssues.some((i) => i.severity === 'error');

  return (
    <AppShell
      pageTitle={t(isEditMode ? 'project_create.title_edit' : 'project_create.title_create')}
      breadcrumb={[t('profile.breadcrumb_home'), t('project_create.breadcrumb_projects'), t(isEditMode ? 'project_create.title_edit' : 'project_create.title_create')]}
    >
      {/* AI Smart Generate Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center space-x-2 mb-3">
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <h3 className="text-lg font-bold text-white">AI Smart Generate</h3>
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Powered by Gemini 3</span>
        </div>
        <p className="text-indigo-100 text-sm mb-4">Describe your circuit idea in one sentence — Gemini 3 will generate the complete project for you.</p>
        <div className="flex space-x-3">
          <input
            type="text"
            value={smartPrompt}
            onChange={(e) => setSmartPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSmartGenerate(); } }}
            placeholder="e.g. A smart home temperature monitor with WiFi and OLED display"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all"
          />
          <button
            type="button"
            onClick={handleSmartGenerate}
            disabled={isSmartGenerating || !smartPrompt.trim()}
            className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center space-x-2 whitespace-nowrap"
          >
            {isSmartGenerating ? (
              <><svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/></svg><span>Generating...</span></>
            ) : (
              <><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span>Generate</span></>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card">
        <form className="p-8 space-y-8">
          {/* AI Sketch Analyzer */}
          <div className="space-y-6">
            <CircuitSketchAnalyzer onAnalysisComplete={handleSketchAnalysis} />
          </div>

          {/* 项目基本信息 */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary border-b border-border-primary pb-3">{t('project_create.section_basic')}</h3>

            {/* 项目名称 */}
            <div className="space-y-2">
              <label htmlFor="project-name" className="block text-sm font-medium text-text-primary">
                  {t('project_create.project_name')} <span className="text-danger">{t('project_create.required')}</span>
              </label>
              <input
                type="text"
                id="project-name"
                name="project-name"
                className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary`}
                placeholder={t('project_create.project_name_placeholder')}
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                required
              />
              <p className="text-xs text-text-secondary">{t('project_create.project_name_hint')}</p>
            </div>

            {/* 项目描述 */}
            <div className="space-y-2">
              <label htmlFor="project-description" className="block text-sm font-medium text-text-primary">
                  {t('project_create.project_description')}
              </label>
              <textarea
                id="project-description"
                name="project-description"
                rows={4}
                className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary resize-none`}
                placeholder={t('project_create.project_description_placeholder')}
                value={formData.projectDescription}
                onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              />
              <p className="text-xs text-text-secondary">{t('project_create.project_description_hint')}</p>
            </div>
          </div>

          {/* 需求输入区 */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary border-b border-border-primary pb-3">{t('project_create.section_requirements')}</h3>

            {/* 文本需求输入 */}
            <div className="space-y-2">
              <label htmlFor="text-requirements" className="block text-sm font-medium text-text-primary">
                  {t('project_create.requirements_label')} <span className="text-danger">{t('project_create.required')}</span>
              </label>
              <textarea
                id="text-requirements"
                name="text-requirements"
                rows={6}
                className={`w-full px-4 py-3 border border-border-primary rounded-lg ${styles.formInputFocus} bg-white text-text-primary placeholder-text-secondary resize-none`}
                placeholder={t('project_create.requirements_placeholder')}
                value={formData.textRequirements}
                onChange={(e) => handleInputChange('textRequirements', e.target.value)}
                required
              />
              <p className="text-xs text-text-secondary">{t('project_create.requirements_hint')}</p>
            </div>

            {/* 图像上传 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                  {t('project_create.upload_label')} <span className="text-text-secondary">{t('project_create.upload_optional')}</span>
              </label>
              <div
                className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaDragover : ''} rounded-lg p-8 text-center cursor-pointer`}
                onClick={handleUploadAreaClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                {!coverImageDataUrl ? (
                  <div>
                    <i className="fas fa-cloud-upload-alt text-4xl text-text-secondary mb-4"></i>
                    <p className="text-text-primary font-medium mb-2">{t('project_create.upload_click')}</p>
                    <p className="text-text-secondary text-sm">{t('project_create.upload_format')}</p>
                    <p className="text-text-secondary text-xs mt-2">{t('project_create.upload_hint')}</p>
                  </div>
                ) : (
                  <div>
                    <img src={coverImageDataUrl} alt={t('project_create.preview_alt')} className="max-w-full max-h-48 mx-auto rounded-lg" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-danger hover:text-danger-dark mt-2 text-sm"
                    >
                      <i className="fas fa-trash mr-1"></i>{t('project_create.remove_image')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary border-b border-border-primary pb-3">
              {t('project_create.section_workflow')} <span className="text-text-secondary text-sm font-normal">{t('project_create.workflow_optional')}</span>
            </h3>

            {/* 可视化预览图 */}
            <div className="border border-border-primary rounded-lg overflow-hidden h-[500px] bg-gray-50">
              {workflow.nodes.length > 0 ? (
                <WorkflowGraph workflow={workflow} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                  <i className="fas fa-project-diagram text-4xl mb-4 opacity-30"></i>
                  <p>{t('project_create.workflow_empty')}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">{t('project_create.add_module')}</label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Select
                        value={moduleToAdd}
                        onChange={setModuleToAdd}
                        options={MODULE_CATALOG.map((m) => ({ label: m.name, value: m.id }))}
                        placeholder={t('project_create.select_module')}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const moduleDefinition = getModuleById(MODULE_CATALOG, moduleToAdd);
                        if (!moduleDefinition) {
                          return;
                        }
                        setWorkflow((prev) => {
                          const nextIndex =
                              prev.nodes.filter((n) => n.moduleId === moduleDefinition.id).length + 1;
                          const node: WorkflowNode = {
                            id: createId('node'),
                            moduleId: moduleDefinition.id,
                            label: `${moduleDefinition.name} #${nextIndex}`,
                          };
                          return { ...prev, nodes: [...prev.nodes, node] };
                        });
                      }}
                      className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-glow transition-all duration-300"
                    >
                      <i className="fas fa-plus mr-2"></i>{t('project_create.btn_add')}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{t('project_create.added_modules')}</span>
                    <span className="text-xs text-text-secondary">{workflow.nodes.length} {t('project_create.modules_count')}</span>
                  </div>
                  <div className="border border-border-primary rounded-lg overflow-hidden">
                    {workflow.nodes.length === 0 ? (
                      <div className="p-4 text-sm text-text-secondary">{t('project_create.no_modules')}</div>
                    ) : (
                      <ul className="divide-y divide-border-primary">
                        {workflow.nodes.map((node) => {
                          const moduleDefinition = getModuleById(MODULE_CATALOG, node.moduleId);
                          return (
                            <li key={node.id} className="p-3 flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-text-primary truncate">{node.label}</div>
                                <div className="text-xs text-text-secondary truncate">{moduleDefinition?.category ?? ''}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setWorkflow((prev) => ({
                                    nodes: prev.nodes.filter((n) => n.id !== node.id),
                                    connections: prev.connections.filter(
                                      (c) => c.from.nodeId !== node.id && c.to.nodeId !== node.id,
                                    ),
                                  }));
                                  setPendingConnection({ fromNodeId: '', fromPortId: '', toNodeId: '', toPortId: '' });
                                }}
                                className="p-2 text-text-secondary hover:text-danger transition-colors"
                                aria-label={t('project_create.remove_module')}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">{t('project_create.add_connection')}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="text-xs text-text-secondary">{t('project_create.source')}</div>
                      <Select
                        value={pendingConnection.fromNodeId}
                        onChange={(value) =>
                          setPendingConnection((prev) => ({
                            ...prev,
                            fromNodeId: value,
                            fromPortId: '',
                          }))
                        }
                        options={workflow.nodes.map((n) => ({ label: n.label, value: n.id }))}
                        placeholder={t('project_create.select_module')}
                      />
                      <Select
                        value={pendingConnection.fromPortId}
                        onChange={(value) => setPendingConnection((prev) => ({ ...prev, fromPortId: value }))}
                        options={(() => {
                          const node = workflow.nodes.find((n) => n.id === pendingConnection.fromNodeId);
                          const moduleDefinition = node ? getModuleById(MODULE_CATALOG, node.moduleId) : undefined;
                          return (moduleDefinition?.ports ?? []).map((p) => ({ label: p.name, value: p.id }));
                        })()}
                        placeholder={t('project_create.select_port')}
                        disabled={!pendingConnection.fromNodeId}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-text-secondary">{t('project_create.target')}</div>
                      <Select
                        value={pendingConnection.toNodeId}
                        onChange={(value) =>
                          setPendingConnection((prev) => ({
                            ...prev,
                            toNodeId: value,
                            toPortId: '',
                          }))
                        }
                        options={workflow.nodes.map((n) => ({ label: n.label, value: n.id }))}
                        placeholder={t('project_create.select_module')}
                      />
                      <Select
                        value={pendingConnection.toPortId}
                        onChange={(value) => setPendingConnection((prev) => ({ ...prev, toPortId: value }))}
                        options={(() => {
                          const node = workflow.nodes.find((n) => n.id === pendingConnection.toNodeId);
                          const moduleDefinition = node ? getModuleById(MODULE_CATALOG, node.moduleId) : undefined;
                          return (moduleDefinition?.ports ?? []).map((p) => ({ label: p.name, value: p.id }));
                        })()}
                        placeholder={t('project_create.select_port')}
                        disabled={!pendingConnection.toNodeId}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-text-secondary">
                        {pendingConnectionIssues.length > 0 ? (
                          <span className="text-danger">
                            <i className="fas fa-exclamation-circle mr-1"></i>
                            {pendingConnectionIssues[0].message}
                          </span>
                        ) : (
                          <span>{t('project_create.connection_hint')}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const { fromNodeId, fromPortId, toNodeId, toPortId } = pendingConnection;
                          if (!fromNodeId || !fromPortId || !toNodeId || !toPortId) {
                            return;
                          }
                          const connection: WorkflowConnection = {
                            id: createId('conn'),
                            from: { nodeId: fromNodeId, portId: fromPortId },
                            to: { nodeId: toNodeId, portId: toPortId },
                          };
                          setWorkflow((prev) => ({ ...prev, connections: [...prev.connections, connection] }));
                          setPendingConnection({ fromNodeId: '', fromPortId: '', toNodeId: '', toPortId: '' });
                        }}
                        className={`px-4 py-2 border border-border-primary rounded-lg font-medium transition-colors ${
                          pendingConnectionIssues.some(i => i.severity === 'error')
                            ? 'bg-bg-secondary text-text-secondary cursor-not-allowed opacity-50'
                            : 'bg-white text-text-primary hover:bg-bg-secondary'
                        }`}
                        disabled={
                          !pendingConnection.fromNodeId ||
                            !pendingConnection.fromPortId ||
                            !pendingConnection.toNodeId ||
                            !pendingConnection.toPortId ||
                            pendingConnectionIssues.some(i => i.severity === 'error')
                        }
                      >
                        <i className="fas fa-link mr-2"></i>{t('project_create.btn_add_connection')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{t('project_create.connection_list')}</span>
                    <span className="text-xs text-text-secondary">{workflow.connections.length} {t('project_create.connections_count')}</span>
                  </div>
                  <div className="border border-border-primary rounded-lg overflow-hidden">
                    {workflow.connections.length === 0 ? (
                      <div className="p-4 text-sm text-text-secondary">{t('project_create.no_connections')}</div>
                    ) : (
                      <ul className="divide-y divide-border-primary">
                        {workflow.connections.map((c) => (
                          <li key={c.id} className="p-3 flex items-center justify-between">
                            <div className="text-sm text-text-primary">
                              {c.from.nodeId.slice(0, 6)}:{c.from.portId} → {c.to.nodeId.slice(0, 6)}:{c.to.portId}
                            </div>
                            <button
                              type="button"
                              onClick={() => setWorkflow((prev) => ({ ...prev, connections: prev.connections.filter((x) => x.id !== c.id) }))}
                              className="p-2 text-text-secondary hover:text-danger transition-colors"
                              aria-label={t('project_create.remove_connection')}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{t('project_create.validation_results')}</span>
                    <span className="text-xs text-text-secondary">{workflowIssues.length} {t('project_create.issues_count')}</span>
                  </div>
                  <div className="border border-border-primary rounded-lg overflow-hidden">
                    {workflowIssues.length === 0 ? (
                      <div className="p-4 text-sm text-success">{t('project_create.no_issues')}</div>
                    ) : (
                      <ul className="divide-y divide-border-primary">
                        {workflowIssues.map((issue) => (
                          <li key={issue.id} className="p-3 flex items-start space-x-3">
                            <span
                              className={[
                                'mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs text-white flex-shrink-0',
                                issue.severity === 'error' ? 'bg-danger' : issue.severity === 'warning' ? 'bg-warning' : 'bg-info',
                              ].join(' ')}
                            >
                              {issue.severity === 'error' ? '!' : issue.severity === 'warning' ? '⚠' : 'i'}
                            </span>
                            <div className="text-sm text-text-primary">{issue.message}</div>
                            {issue.id === 'i2c-pullup-missing' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const moduleDefinition = getModuleById(MODULE_CATALOG, 'glue_i2c_pullup');
                                  if (!moduleDefinition) {
                                    return;
                                  }
                                  setWorkflow((prev) => {
                                    const nextIndex =
                                        prev.nodes.filter((n) => n.moduleId === moduleDefinition.id).length + 1;
                                    const node: WorkflowNode = {
                                      id: createId('node'),
                                      moduleId: moduleDefinition.id,
                                      label: `${moduleDefinition.name} #${nextIndex}`,
                                    };
                                    return { ...prev, nodes: [...prev.nodes, node] };
                                  });
                                }}
                                className="ml-auto px-3 py-1 bg-bg-secondary text-text-primary border border-border-primary rounded-lg text-xs hover:bg-white transition-colors"
                              >
                                  {t('project_create.quick_add')}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮区 */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border-primary">
            <button
              type="button"
              onClick={handleCancel}
              className={`px-6 py-3 ${styles.btnSecondary} rounded-lg font-medium`}
            >
              <i className="fas fa-times mr-2"></i>
                {t('project_create.btn_cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-6 py-3 bg-warning text-white rounded-lg font-medium hover:bg-warning-dark transition-all duration-300 disabled:opacity-50"
            >
              <i className={`fas ${isSavingDraft ? 'fa-check' : 'fa-save'} mr-2`}></i>
              {isSavingDraft ? t('project_create.btn_saved') : t('project_create.btn_save_draft')}
            </button>
            <button
              type="button"
              onClick={handleStartGenerate}
              className={`px-8 py-3 ${styles.btnPrimary} text-white rounded-lg font-medium ${hasWorkflowErrors ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={hasWorkflowErrors}
            >
              <i className="fas fa-magic mr-2"></i>
                {t('project_create.btn_generate')}
            </button>
          </div>
        </form>
      </div>

      {/* 提示信息 */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-lightbulb text-white"></i>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-text-primary">{t('project_create.tips_title')}</h4>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• {t('project_create.tip_1')}</li>
              <li>• {t('project_create.tip_2')}</li>
              <li>• {t('project_create.tip_3')}</li>
              <li>• {t('project_create.tip_4')}</li>
              <li>• {t('project_create.tip_5')}</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ProjectCreatePage;
