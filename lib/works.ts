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
  order: number;
}

const dataFilePath = path.join(process.cwd(), 'data', 'works.json');

export function getWorks(): Work[] {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    let works: Work[] = JSON.parse(data);
    works = works.map((w, i) => ({
      ...w,
      order: typeof w.order === 'number' ? w.order : i + 1,
    }));
    return works.sort((a, b) => a.order - b.order);
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
  const maxOrder = works.length > 0 ? Math.max(...works.map((w) => w.order)) : 0;
  work.order = maxOrder + 1;
  works.push(work);
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

export function reorderWorks(orderedIds: string[]): Work[] {
  const works = getWorks();
  orderedIds.forEach((id, index) => {
    const work = works.find((w) => w.id === id);
    if (work) {
      work.order = index + 1;
    }
  });
  saveWorks(works);
  return works;
}
