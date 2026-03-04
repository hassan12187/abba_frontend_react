import { useState, type ReactNode} from "react";
import { createContext } from "react";
import { useContext } from "react";

const StoreContext = createContext<any>(null);
type T = any;
interface typeInterface{
token:string,
setToken:React.SetStateAction<T>
};
interface StoreChildren{
    children:ReactNode
};
export const Store=({children}:StoreChildren):React.ReactNode=>{
    const [token,setToken]=useState<string>("");
    const [toggleDarkMode,setToggleDarkMode]=useState<boolean>(false);

    return <StoreContext.Provider value={{token,setToken,toggleDarkMode,setToggleDarkMode}}>
        {children}
    </StoreContext.Provider>
};
export const useCustom=():typeInterface=>useContext<typeInterface>(StoreContext);