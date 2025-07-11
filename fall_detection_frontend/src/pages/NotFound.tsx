import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you accessed does not exist."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Return to the homepage.
        </Button>
      }
    />
  );
};

export default NotFound;
