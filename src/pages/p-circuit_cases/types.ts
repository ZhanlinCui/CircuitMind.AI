

export interface CaseData {
  id: string;
  name: string;
  application: string;
  complexity: string;
  description: string;
  image: string;
  date: string;
  views: string;
  components: Array<{
    name: string;
    type: string;
  }>;
  files: Array<{
    name: string;
    size: string;
  }>;
}

export interface CaseDatabase {
  [key: string]: CaseData;
}

