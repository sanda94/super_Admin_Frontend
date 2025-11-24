import "./circle.scss";

const Circle = ({
  title,
  value,
  unVal,
  bgColor,
  icon,
}: {
  title: string;
  value: string;
  unVal: string;
  bgColor: string;
  icon: string;
}) => {
  return (
    <div
      className="zooming-circle"
      style={{
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        backgroundColor: bgColor,
        margin: "15px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        borderWidth: "10px",
        borderStyle: "solid",
        borderColor:
          title == "Item Count" || title == "Battery Percentage"
            ? parseFloat(unVal) < 20
              ? "red"
              : "#3076e6"
            : "rgb(48, 118, 230)",
      }}
    >
      <img
        src={icon}
        style={{ width: "40px", height: "40px", marginBottom: "5px" }}
        alt=""
      />
      <p
        className="circle-text"
        style={{ color: "#000000", fontSize: "0.8rem" }}
      >
        {title}
      </p>
      <p
        className="circle-value"
        style={{
          color: "#000000",
          marginTop: "10px",
          fontSize: "1.5rem",
        }}
      >
        {value}
      </p>
    </div>
  );
};
export default Circle;
