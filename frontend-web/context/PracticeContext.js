'use client';

import { createContext, useContext, useState } from 'react';

const PracticeContext = createContext();

export function PracticeProvider({ children }) {
    const [isPracticing, setIsPracticing] = useState(false);

    return (
        <PracticeContext.Provider value={{ isPracticing, setIsPracticing }}>
            {children}
        </PracticeContext.Provider>
    );
}

export function usePractice() {
    return useContext(PracticeContext);
}
