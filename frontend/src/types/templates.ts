export interface Template {
  id: number;
  name: string;
  front_config: any;
  back_config: any;
  is_active: boolean;
  preview_images?: any;
}


export interface TemplatesProps {
  refreshTrigger: number;
  onSelect: (template: Template) => void;
  activeId?: number;
}

