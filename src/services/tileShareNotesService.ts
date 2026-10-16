import { TileShareNotesApi } from '@/api/tileShareNotesApi';
import { NotesService } from './notesService';

export const tileShareNotesService = new NotesService(new TileShareNotesApi());
export const clusterNotesService = new NotesService(new TileShareNotesApi('cluster'));
