import { useState } from "react";
import { Typography, Button } from "@mui/material";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");       // error message state
  const [data, setData] = useState([]);         // backend preview rows

  // File select handler
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError("");  // reset error
    setData([]);   // clear previous table
  };

  // Upload button handler (async for backend fetch)
  const handleUpload = async () => {
    if (!file) {
      setError("⚠ Please select a file before uploading!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log(result);  // check backend JSON

      if (result.error) {
        setError("⚠ " + result.error);
        setData([]);
        return;
      }

      setData(result.preview);  // show first 5 rows
      setError("");             // clear error

    } catch (err) {
      console.error("Upload failed:", err);
      setError("⚠ Upload failed. Please try again!");
      setData([]);
    }
  };

  return (
    <div className="page-center">
      <div className="center-box">

        <Typography variant="h4" gutterBottom>
          Upload Dataset
        </Typography>

        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={handleFileChange}
        />

        {file && (
          <p style={{ marginTop: "10px" }}>
            Selected file: <b>{file.name}</b>
          </p>
        )}

        {error && (
          <p style={{ color: "#d32f2f", marginTop: "15px", fontWeight: 600 }}>
            {error}
          </p>
        )}

        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={handleUpload}
        >
          Upload File
        </Button>

        {/* SaaS-style preview table */}
        {data.length > 0 && (
          <table style={{ marginTop: 20, width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {Object.keys(data[0]).map((col) => (
                  <th key={col} style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    backgroundColor: "#f5f5f5",
                    fontWeight: 600
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} style={{ border: "1px solid #ccc", padding: "8px" }}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}








// // import React from "react";
// // import { Container, Typography } from "@mui/material";

// // export default function Upload() {
// //   return (
// //     // <Container sx={{ mt: 10, textAlign: "center" }}>
    
// //      <div className="page-center">
// //       <div className="center-box">
// //       <Typography variant="h3" gutterBottom>
// //         Upload Page
// //       </Typography>
// //       <Typography variant="body1">
// //         File upload component will be here
// //       </Typography>
// //       </div>
// //       </div>
// //     // </Container>
// //   );
// // }
// import { useState } from "react";
// import { Typography, Button } from "@mui/material";

// export default function Upload() {

//   const [file, setFile] = useState(null);
//   const [error, setError] = useState("");  // error message state
//   const [data, setData] = useState([]); // backend se preview rows store karne ke liye

//   // file select handler
//   const handleFileChange = (event) => {
//     const selectedFile = event.target.files[0];
//     setFile(selectedFile);
//     setError(""); // reset error on new file select
//   };

//   // upload button handler
// //   const handleUpload = () => {
// //     if (!file) {
// //       setError("⚠ Please select a file before uploading!");
// //       return;
// //     }
    

// //     console.log("Uploading:", file.name);

// //     // future: backend upload
// //     setError(""); // clear error on successful upload
// //     // future backend upload code yaha add hoga
// //   };

// const handleUpload = async () => {
//   if (!file) {
//     setError("⚠ Please select a file before uploading!");
//     return;
//   }

//   const formData = new FormData();
//   formData.append("file", file);

//   try {
//     const response = await fetch("http://localhost:8000/upload", {
//       method: "POST",
//       body: formData,
//     });

//     const result = await response.json();
//     console.log(result); // backend se aaya hua JSON

//     // optional: preview table ke liye
//     setData(result.preview);
//     setError(""); // clear error on success
//   } catch (err) {
//     console.error("Upload failed:", err);
//     setError("⚠ Upload failed. Try again!");
//   }
// };
//   return (
//     <div className="page-center">
//       <div className="center-box">

//         <Typography variant="h4" gutterBottom>
//           Upload Dataset
//         </Typography>

//         <input
//           type="file"
//           accept=".csv, .xlsx"
//           onChange={handleFileChange}
//         />

//         {file && (
//           <p style={{ marginTop: "10px" }}>
//             Selected file: <b>{file.name}</b>
//           </p>
//         )}

//          {error && (
//           <p style={{ color: "#d32f2f", marginTop: "15px", fontWeight: 600 }}>
//             {error}
//           </p>
//         )}
        
//         <Button
//           variant="contained"
//           sx={{ mt: 3 }}
//           onClick={handleUpload}
//         >
//           Upload File
//         </Button>

//       </div>
//     </div>
//   );
// }