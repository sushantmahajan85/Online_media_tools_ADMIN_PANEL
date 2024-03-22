import { useEffect, useState } from "react";
import style from "./ui.module.css";
import { Table } from "reactstrap";
import { toast } from "react-toastify";
import axios from "axios";
import { Loader } from "../Loader/loader";
// import {  Button } from "reactstrap";
const serverURL = process.env.REACT_APP_SERVER_URL;

export function ReportRequests() {
  const [reportedUsers, setReportedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchReportedUsers() {
      setLoading(true);
      try {
        const reportedUsers = await axios.get(
          `${serverURL}/api/users/reportedUsers`
        );
        setReportedUsers(reportedUsers.data.reportedUsers);
        toast.success("Report request fetched");
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch report requests");
      } finally {
        setLoading(false);
      }
    }
    fetchReportedUsers();
  }, []);

  //   async function handleStatusChange(reportId, action) {
  //     setLoading(true);
  //     try {
  //       const response = await axios.post(
  //         `${serverURL}/api/users/reportedUser/changeStatus`,
  //         {
  //           reportId,
  //           action,
  //         }
  //       );
  //       const updatedStatus = response.data.updatedStatus;
  //       setReportedUsers((reportRequests) => {
  //         const reports = reportRequests.map((report) => {
  //           if (report._id === reportId) {
  //             report.status = updatedStatus;
  //           }
  //           return report;
  //         });
  //         return [...reports];
  //       });
  //       toast.success("Upated report status");
  //     } catch (error) {
  //       console.log(error);
  //       toast.success("Failed to update report status");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  return (
    <>
      <div className={`p-2  text-light ${style.Sheading} `}>
        <h2 className={style.Heading}>User Report Requests</h2>
      </div>

      <div>
        <Table>
          <thead>
            <th>Reported User</th>
            <th>Reporting User</th>
            {/* <th>Status</th> */}
            <th>Reason</th>
            {/* <th>Action</th> */}
          </thead>
          <tbody>
            {reportedUsers.map(
              ({ _id, reason, reportedUserId, reporterUserId, status }) => (
                <tr key={_id} className="border-top">
                  <td>
                    {reportedUserId?.firstName} {reportedUserId?.lastName}
                  </td>
                  <td>
                    {reporterUserId?.firstName} {reporterUserId?.lastName}
                  </td>
                  {/* <td>{status}</td> */}
                  <td>{reason}</td>
                  {/* <td style={{ display: "flex", gap: 10 }}>
                                    {status === "Pending" && (
                                        <>
                                            <Button onClick={() => handleStatusChange(_id, 'Denied')} color="danger"><i className="bi bi-x"></i></Button>
                                            <Button onClick={() => handleStatusChange(_id, 'Accepted')} color="success"><i className="bi bi-check-lg"></i></Button>
                                        </>
                                    )}
                                </td> */}
                </tr>
              )
            )}
          </tbody>
        </Table>
      </div>
      <Loader loading={loading} />
    </>
  );
}
