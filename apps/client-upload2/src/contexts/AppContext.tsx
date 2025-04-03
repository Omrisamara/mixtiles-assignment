import React, { createContext, useState, ReactNode } from 'react';
import { clusterDataMock } from '../components/mocks/clusterData.mock';

export type ClusterData = {
    clusterId: number;
    label: string;
    photos: {
        filename: string;
        url: string;
        takenTime?: Date;
        location?: { lat: number; lng: number };
        description: string;
      }[];
}

interface AppContextType {
  narratives: ClusterData[];
  setNarratives: React.Dispatch<React.SetStateAction<ClusterData[]>>;
}

const defaultContext: AppContextType = {
  narratives: [],
  setNarratives: () => {},
};

export const AppContext = createContext<AppContextType>(defaultContext);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [narratives, setNarratives] = useState<ClusterData[]>(clusterDataMock);

  return (
    <AppContext.Provider value={{ narratives, setNarratives }}>
      {children}
    </AppContext.Provider>
  );
}; 