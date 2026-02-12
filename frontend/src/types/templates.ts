export interface Template {
  id: number;
  name: string;
  front_config: any;
  back_config: any;
  is_active: boolean;
}

export interface TemplatesProps {
  refreshTrigger: number;
  onSelect: (template: Template) => void;
  activeId?: number;
}

