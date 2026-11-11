export const metadata = {
  title: "KSP Self Drive Cars | Car Rental in Pune & Wagholi",
  description: "Premium self-drive car rental agency in Pune. Book hatchbacks to SUVs with doorstep delivery, instant refund, and zero hidden charges.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#0f172a" }}>
        {children}
      </body>
    </html>
  );
}
