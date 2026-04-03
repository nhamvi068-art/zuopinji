import fs from 'fs';
import path from 'path';

export interface WorkImage {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Work {
  id: string;
  title: string;
  category: string;
  description: string;
  coverImage: string;
  coverWidth?: number;
  coverHeight?: number;
  images: WorkImage[];
  createdAt: string;
}

const dataFilePath = path.join(process.cwd(), 'data', 'works.json');

export function getWorks(): Work[] {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading works data:', error);
    return [];
  }
}

export function saveWorks(works: Work[]): void {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(works, null, 2));
  } catch (error) {
    console.error('Error saving works data:', error);
    throw error;
  }
}

export function addWork(work: Work): Work[] {
  const works = getWorks();
  works.unshift(work);
  saveWorks(works);
  return works;
}

export function deleteWork(id: string): Work[] {
  const works = getWorks();
  const filtered = works.filter((work) => work.id !== id);
  saveWorks(filtered);
  return filtered;
}

export function updateWork(id: string, updatedWork: Partial<Work>): Work[] {
  const works = getWorks();
  const index = works.findIndex((work) => work.id === id);
  if (index !== -1) {
    works[index] = { ...works[index], ...updatedWork };
    saveWorks(works);
  }
  return works;
}
