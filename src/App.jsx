import { RouterProvider, createBrowserRouter } from 'react-router-dom';
// // Layout Components
import Layout from './components/Layout/Layout';
// // Page Components
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
// import AdmissionForm from './pages/AdmissionForm/AdmissionForm';
import Expenses from './pages/Expenses/Expenses';
import Payments from './pages/Payments/Payments';
import Reports from './pages/Reports/Reports';
import Rooms from './pages/Rooms/Rooms';
import Login from './pages/Login/Login';
import StudentApplications from './pages/StudentApplications/StudentApplications';
import Students from './pages/Students/Students';
// Import FontAwesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import CheckAuth from './components/CheckAuth';
// import 'bootstrap/dist/css/bootstrap.css';
import AdmissionForm from './pages/AdmissionForm/AdmissionForm';
import Settings from './pages/Settings/Settings';
import Blocks from './pages/Blocks/Blocks';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPassword';

const App=()=>{
  const router=createBrowserRouter([
    {
      path:'/',
      element:<Layout/>,
      errorElement:<Unauthorized title={"Error"} info={"Error 404 Page Not Found."} />,
      children:[
      { 
        path:"/",
        element:<CheckAuth><AdminDashboard /></CheckAuth>
      },
      {
        path:'/expenses',
        element:<CheckAuth><Expenses /></CheckAuth>
      },
      {
        path:'/payments',
        element:<CheckAuth><Payments /></CheckAuth>
      },
      {
        path:'/rooms',
        element:<CheckAuth><Rooms /></CheckAuth>
      },
      {
        path:'/reports',
        element:<CheckAuth><Reports /></CheckAuth>
      },
      {
        path:'/applications',
        element:<CheckAuth><StudentApplications /></CheckAuth>
      },
      {
        path:"/students",
        element:<CheckAuth><Students /></CheckAuth>
      },
      {
        path:"/settings",
        element:<CheckAuth><Settings /></CheckAuth>
      },
      {
        path:"/blocks",
        element:<CheckAuth><Blocks /></CheckAuth>
      }
      ]
    },
    {
      path:'/login',
      element:<Login />
    },
    {
      path:'/unauthorize',
      element:<Unauthorized title={'Access Denied'} info={"You don't have permission to access this page."} />
    },
    {
      path:'/admission-form',
      element:<AdmissionForm />
    },
    {
      path:"/forgot-password",
      element:<ForgotPasswordPage/>
    }
  ]);
  return <RouterProvider router={router}/>
};
export default App;