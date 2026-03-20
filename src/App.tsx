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
import Login from './pages/Login/Login.js';
import StudentApplications from './pages/StudentApplications/StudentApplications.js';
import Students from './pages/Students/Students.js';
// Import FontAwesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';
import Unauthorized from './pages/Unauthorized/Unauthorized.js';
import CheckAuth from './components/CheckAuth';
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
import { AttendancePanel } from './pages/Mess/MessAttendance.js';
import { SubscriptionsPanel } from './pages/Mess/messSubscription/MessSubscription.js';

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
      // {
      //   path:"/settings",
      //   element:<CheckAuth><Settings /></CheckAuth>
      // },
      {
        path:"/blocks",
        element:<CheckAuth><Blocks /></CheckAuth>
      },
      {
        path:"/complaints",
        element:<CheckAuth><Complaints /></CheckAuth>
      },
      {
        path:"/fee-template",
        element:<CheckAuth><FeeTemplateAdmin /></CheckAuth>
      },
        {
        path:"/fee-invoice",
        element:<CheckAuth><FeeInvoiceUI /></CheckAuth>
      },
       {
        path:"/create/fee-invoice",
        element:<CheckAuth><CreateFeeInvoice /></CheckAuth>
      },
       {
        path:"/mess-menu",
        element:<CheckAuth><MenuPanel /></CheckAuth>
      },
      {
        path:"/mess-attendance",
        element:<CheckAuth><AttendancePanel /></CheckAuth>
      },
         {
        path:"/mess-subscription",
        element:<CheckAuth><SubscriptionsPanel /></CheckAuth>
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