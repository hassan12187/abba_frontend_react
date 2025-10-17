import { useState } from "react";
import { createContext } from "react";
import { useContext } from "react";

const StoreContext = createContext(null);

export const Store=({children})=>{
    const [token,setToken]=useState("");
    const [toggleDarkMode,setToggleDarkMode]=useState(false);

    return <StoreContext.Provider value={{token,setToken,toggleDarkMode,setToggleDarkMode}}>
        {children}
    </StoreContext.Provider>
};
export const useCustom=()=>useContext(StoreContext);