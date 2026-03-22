import { RouterProvider, createBrowserRouter } from 'react-router-dom';
// // Layout Components
import Layout from './components/Layout/Layout.js';
// // Page Components
import AdminDashboard from './pages/AdminDashboard/AdminDashboard.js';
// import AdmissionForm from './pages/AdmissionForm/AdmissionForm';
import Expenses from './pages/Expenses/Expenses.js';
import Payments from './pages/Payments/Payments.js';
import Reports from './pages/Reports/Reports.js';
import Rooms from './pages/hostel/Rooms.js';
import Settings from "./pages/Settings/Settings.js";
import Login from './pages/Login/Login.js';
import StudentApplications from './pages/StudentApplications/StudentApplications.js';
import Students from './pages/Students/Students.js';
// Import FontAwesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';
import Unauthorized from './pages/Unauthorized/Unauthorized.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import 'bootstrap/dist/css/bootstrap.css';
// import "./theme.css"
import AdmissionForm from './pages/AdmissionForm/AdmissionForm.js';
import Blocks from './pages/hostel/Blocks.js';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPassword.js';
import Complaints from './pages/Complaints/Complaints.js';
import FeeTemplateAdmin from './pages/FeeTemplate/FeeTemplate.js';
import FeeInvoiceUI from './pages/FeeInvoice/FeeInvoice.js';
import CreateFeeInvoice from './pages/FeeInvoice/createFeeInvoice.js';
import { MenuPanel } from './pages/Mess/menupanel/MessMenu.js';
import { AttendancePanel } from './pages/Mess/mealattendance/MessAttendance.js';
import { SubscriptionsPanel } from './pages/Mess/messSubscription/MessSubscription.js';

const App=()=>{
  const router=createBrowserRouter([
    {
      path:'/',
      element:<ProtectedRoute><Layout/></ProtectedRoute>,
      errorElement:<Unauthorized title={"Error"} info={"Error 404 Page Not Found."} />,
      children:[
      { 
        path:"/",
        element:<AdminDashboard />
      },
      {
        path:'/expenses',
        element:<Expenses />
      },
      {
        path:'/payments',
        element:<Payments />
      },
      {
        path:'/rooms',
        element:<Rooms />
      },
      {
        path:'/reports',
        element:<Reports />
      },
      {
        path:'/applications',
        element:<StudentApplications />
      },
      {
        path:"/students",
        element:<Students />
      },
      {
        path:"/settings",
        element:<Settings />
      },
      {
        path:"/blocks",
        element:<Blocks />
      },
      {
        path:"/complaints",
        element:<Complaints />
      },
      {
        path:"/fee-template",
        element:<FeeTemplateAdmin />
      },
        {
        path:"/fee-invoice",
        element:<FeeInvoiceUI />
      },
       {
        path:"/create/fee-invoice",
        element:<CreateFeeInvoice />
      },
       {
        path:"/mess-menu",
        element:<MenuPanel />
      },
      {
        path:"/mess-attendance",
        element:<AttendancePanel />
      },
         {
        path:"/mess-subscription",
        element:<SubscriptionsPanel />
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