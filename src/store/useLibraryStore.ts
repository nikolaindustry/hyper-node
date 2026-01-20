import { create } from 'zustand';
import { type Library, type FunctionDef, type ClassDef } from '../models/types';
import coreLibrary from '../data/coreLibrary.json';
import servoLibrary from '../data/servoLibrary.json';

interface LibraryState {
  libraries: Library[];
  activeLibraries: string[]; // Names of libraries currently in use
  addLibrary: (library: Library) => void;
  removeLibrary: (libraryName: string) => void;
  toggleLibrary: (libraryName: string) => void;
  getLibrary: (libraryName: string) => Library | undefined;
  getAllFunctions: () => FunctionDef[];
  getAllClasses: () => ClassDef[];
  getFunctionsByCategory: () => Record<string, FunctionDef[]>;
  isLibraryActive: (libraryName: string) => boolean;
}

// Type assertion for JSON imports
const typedCoreLibrary = coreLibrary as Library;
const typedServoLibrary = servoLibrary as Library;

export const useLibraryStore = create<LibraryState>((set, get) => ({
  libraries: [typedCoreLibrary, typedServoLibrary],
  activeLibraries: ['Arduino'], // Core Arduino is always active by default

  addLibrary: (library) => {
    const { libraries } = get();
    if (libraries.some((l) => l.name === library.name)) {
      console.warn(`Library ${library.name} already exists`);
      return;
    }
    set({
      libraries: [...libraries, library],
    });
  },

  removeLibrary: (libraryName) => {
    // Don't allow removing core Arduino library
    if (libraryName === 'Arduino') return;
    
    set({
      libraries: get().libraries.filter((l) => l.name !== libraryName),
      activeLibraries: get().activeLibraries.filter((n) => n !== libraryName),
    });
  },

  toggleLibrary: (libraryName) => {
    const { activeLibraries } = get();
    // Arduino core is always active
    if (libraryName === 'Arduino') return;

    if (activeLibraries.includes(libraryName)) {
      set({
        activeLibraries: activeLibraries.filter((n) => n !== libraryName),
      });
    } else {
      set({
        activeLibraries: [...activeLibraries, libraryName],
      });
    }
  },

  getLibrary: (libraryName) => {
    return get().libraries.find((l) => l.name === libraryName);
  },

  getAllFunctions: () => {
    const { libraries, activeLibraries } = get();
    const functions: FunctionDef[] = [];

    libraries
      .filter((lib) => activeLibraries.includes(lib.name))
      .forEach((lib) => {
        // Add standalone functions
        functions.push(...lib.functions);

        // Add class methods
        lib.classes.forEach((cls) => {
          functions.push(...cls.methods);
        });
      });

    return functions;
  },

  getAllClasses: () => {
    const { libraries, activeLibraries } = get();
    const classes: ClassDef[] = [];

    libraries
      .filter((lib) => activeLibraries.includes(lib.name))
      .forEach((lib) => {
        classes.push(...lib.classes);
      });

    return classes;
  },

  getFunctionsByCategory: () => {
    const { libraries, activeLibraries } = get();
    const byCategory: Record<string, FunctionDef[]> = {};

    libraries
      .filter((lib) => activeLibraries.includes(lib.name))
      .forEach((lib) => {
        // Add standalone functions
        lib.functions.forEach((fn) => {
          const category = fn.category || lib.displayName;
          if (!byCategory[category]) {
            byCategory[category] = [];
          }
          byCategory[category].push(fn);
        });

        // Add class methods
        lib.classes.forEach((cls) => {
          cls.methods.forEach((method) => {
            const category = method.category || cls.name;
            if (!byCategory[category]) {
              byCategory[category] = [];
            }
            byCategory[category].push(method);
          });
        });
      });

    return byCategory;
  },

  isLibraryActive: (libraryName) => {
    return get().activeLibraries.includes(libraryName);
  },
}));
