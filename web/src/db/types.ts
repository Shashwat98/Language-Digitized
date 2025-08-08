export type InscriptionMeta = {
  id: string;            // nanoid
  createdAt: number;
  updatedAt: number;
  title?: string;
  tags?: string[];
  notes?: string;
};

export type Inscription = InscriptionMeta & {
  svg: string;           // serialized SVG markup
  thumbPng: Blob;        // small PNG thumbnail for gallery
};
