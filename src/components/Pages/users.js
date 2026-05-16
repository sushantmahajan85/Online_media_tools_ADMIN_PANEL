import UsersTable from "./usertables";
import { Col } from "reactstrap";

export const Users = () => {
  return (
    <div>
      <Col lg="12" className="px-0">
        <UsersTable />
      </Col>
    </div>
  );
};

