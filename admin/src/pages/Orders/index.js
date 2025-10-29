import React, { useContext } from "react";
import { editData, fetchDataFromApi } from "../../utils/api";
import { useState } from "react";
import { useEffect } from "react";

import { emphasize, styled } from "@mui/material/styles";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Pagination from "@mui/material/Pagination";
import Dialog from "@mui/material/Dialog";
import { MdClose } from "react-icons/md";
import Button from "@mui/material/Button";
import { MdOutlineEmail } from "react-icons/md";
import { FaPhoneAlt, FaPrint } from "react-icons/fa";
import { MdOutlineCurrencyRupee, MdPhp } from "react-icons/md";
import { MdOutlineDateRange } from "react-icons/md";

import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { MyContext } from "../../App";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

const label = { inputProps: { "aria-label": "Checkbox demo" } };

//breadcrumb code
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    "&:hover, &:focus": {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    "&:active": {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const columns = [
  { id: "orderId", label: "Order Id", minWidth: 150 },
  { id: "paymantId", label: "Paymant Id", minWidth: 100 },
  {
    id: "products",
    label: "Products",
    minWidth: 150,
  },
  {
    id: "name",
    label: "Name",
    minWidth: 130,
  },
  {
    id: "phoneNumber",
    label: "Phone Number",
    minWidth: 150,
  },
  {
    id: "address",
    label: "Address",
    minWidth: 200,
  },
  {
    id: "pincode",
    label: "Pincode",
    minWidth: 120,
  },
  {
    id: "totalAmount",
    label: "Total Amount",
    minWidth: 120,
  },
  {
    id: "email",
    label: "Email",
    minWidth: 120,
  },
  {
    id: "userId",
    label: "User Id",
    minWidth: 120,
  },
  {
    id: "orderStatus",
    label: "Order Status",
    minWidth: 120,
  },
  
  {
    id: "dateCreated",
    label: "Date Created",
    minWidth: 150,
  },
  {
    id: "actions",
    label: "Actions",
    minWidth: 100,
  },
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setproducts] = useState([]);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [riders, setRiders] = useState([]);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [assigningLoading, setAssigningLoading] = useState(false);
  
  // Calculate total sales from delivered orders
  const calculateDeliveredSales = () => {
    return orders
      .filter(order => order.status === 'delivered')
      .reduce((total, order) => total + (parseFloat(order.amount) || 0), 0);
  };

  // Calculate today's sales from delivered orders
  const calculateTodaySales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    return orders
      .filter(order => {
        const orderDate = new Date(order.date);
        orderDate.setHours(0, 0, 0, 0); // Start of order date
        return order.status === 'delivered' && orderDate.getTime() === today.getTime();
      })
      .reduce((total, order) => total + (parseFloat(order.amount) || 0), 0);
  };

  const [singleOrder, setSingleOrder] = useState();
  const [statusVal, setstatusVal] = useState(null);

  const context = useContext(MyContext);
  const [isLoading, setIsLoading] = useState(false);

  const [page1, setPage1] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage1(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage1(0);
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchDataFromApi(`/api/orders`).then((res) => {
      // Sort orders by date in descending order (newest first)
      const sortedOrders = res.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      setOrders(sortedOrders);
    });

    // fetch riders for assign dropdown (admin-only endpoint)
    fetchDataFromApi(`/api/user/admin/riders`).then((res) => {
      setRiders(res || []);
    });
  }, []);

  const showProducts = (id) => {
    fetchDataFromApi(`/api/orders/${id}`).then((res) => {
      setIsOpenModal(true);
      setproducts(res.products);
    });
  };

  const openRiderModal = async (order) => {
    // fetch latest order details
    const fresh = await fetchDataFromApi(`/api/orders/${order._id}`);
    setSelectedOrderForRider(fresh);
    setSelectedRiderId(fresh?.deliveryRider || null);
    setIsRiderModalOpen(true);
  };

  const handleAssignRider = async () => {
    if (!selectedOrderForRider || !selectedRiderId) return;
    setAssigningLoading(true);
    try {
      await editData(`/api/orders/assign-rider/${selectedOrderForRider._id}`, {
        riderId: selectedRiderId,
      });
      // refresh orders
      const updated = await fetchDataFromApi(`/api/orders`);
      setOrders(updated);
      // refresh selected order
      const fresh = await fetchDataFromApi(`/api/orders/${selectedOrderForRider._id}`);
      setSelectedOrderForRider(fresh);
    } catch (err) {
      console.error('Assign rider error', err);
    } finally {
      setAssigningLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      // simple feedback could be added (snackbar)
    } catch (err) {
      console.error('copy failed', err);
    }
  };

  const printReceipt = async (orderId) => {
    try {
      // Fetch full order details including products
      const orderData = await fetchDataFromApi(`/api/orders/${orderId}`);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      // Generate receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - Order ${orderData.orderId || orderData._id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .receipt-header h1 {
              font-size: 28px;
              margin-bottom: 5px;
            }
            .receipt-header p {
              color: #666;
              font-size: 14px;
            }
            .order-info {
              margin-bottom: 20px;
            }
            .order-info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .order-info-row strong {
              color: #333;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0 10px;
              padding-bottom: 5px;
              border-bottom: 2px solid #333;
            }
            .customer-info, .delivery-info {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .info-row {
              padding: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            table th {
              background: #333;
              color: white;
              padding: 12px;
              text-align: left;
              font-size: 14px;
            }
            table td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            table tr:hover {
              background: #f5f5f5;
            }
            .total-section {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              padding: 8px 0;
              font-size: 16px;
            }
            .total-row.grand-total {
              font-size: 20px;
              font-weight: bold;
              border-top: 2px solid #333;
              padding-top: 10px;
              margin-top: 10px;
            }
            .total-label {
              margin-right: 20px;
              min-width: 150px;
            }
            .receipt-footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #333;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-confirm { background: #d1ecf1; color: #0c5460; }
            .status-in-transit { background: #d4edda; color: #155724; }
            .status-delivered { background: #d4edda; color: #155724; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h1>Rich Agri Supply</h1>
            <p>Order Receipt</p>
          </div>

          <div class="order-info">
            <div class="order-info-row">
              <strong>Order ID:</strong>
              <span>${orderData.orderId || orderData._id}</span>
            </div>
            <div class="order-info-row">
              <strong>Payment ID:</strong>
              <span>${orderData.paymentId || 'N/A'}</span>
            </div>
            <div class="order-info-row">
              <strong>Order Date:</strong>
              <span>${orderData.date ? new Date(orderData.date).toLocaleString() : 'N/A'}</span>
            </div>
            <div class="order-info-row">
              <strong>Status:</strong>
              <span class="status-badge status-${orderData.status || 'pending'}">${orderData.status || 'Pending'}</span>
            </div>
          </div>

          <div class="section-title">Customer Information</div>
          <div class="customer-info">
            <div class="info-row"><strong>Name:</strong> ${orderData.name}</div>
            <div class="info-row"><strong>Email:</strong> ${orderData.email}</div>
            <div class="info-row"><strong>Phone:</strong> ${orderData.phoneNumber}</div>
          </div>

          <div class="section-title">Delivery Information</div>
          <div class="delivery-info">
            <div class="info-row"><strong>Address:</strong> ${orderData.address}</div>
            <div class="info-row"><strong>Pincode:</strong> ${orderData.pincode}</div>
            ${orderData.deliveryRider ? `<div class="info-row"><strong>Delivery Rider:</strong> ${orderData.deliveryRider.name || orderData.deliveryRider}</div>` : ''}
          </div>

          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.products?.map(item => `
                <tr>
                  <td>${item.productTitle || 'Product'}</td>
                  <td>${item.quantity}</td>
                  <td>₱${parseFloat(item.price).toFixed(2)}</td>
                  <td>₱${parseFloat(item.subTotal).toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No products found</td></tr>'}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row grand-total">
              <span class="total-label">TOTAL AMOUNT:</span>
              <span>₱${parseFloat(orderData.amount).toFixed(2)}</span>
            </div>
          </div>

          <div class="receipt-footer">
            <p>Thank you for your order!</p>
            <p>For inquiries, please contact our customer service.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px;">Print Receipt</button>
            <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; background: #6c757d; color: white; border: none; border-radius: 5px; margin-left: 10px;">Close</button>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  const handleChangeStatus = (e, orderId) => {
    // First check if the current order is already delivered
    const currentOrder = orders.find(order => order._id === orderId);
    if (currentOrder?.status === 'delivered') {
      alert('Cannot modify status of delivered orders');
      return;
    }

    setstatusVal(e.target.value);
    setIsLoading(true);
    context.setProgress(40);
    fetchDataFromApi(`/api/orders/${orderId}`).then((res) => {
      const order = {
        name: res.name,
        phoneNumber: res.phoneNumber,
        address: res.address,
        pincode: res.pincode,
        amount: parseInt(res.amount),
        paymentId: res.paymentId,
        email: res.email,
        userid: res.userId,
        products: res.products,
        status: e.target.value,
      };

      editData(`/api/orders/${orderId}`, order).then((res) => {
        fetchDataFromApi(`/api/orders`).then((res) => {
          // Maintain sort order when updating orders
          const sortedOrders = res.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
          });
          setOrders(sortedOrders);
        });
        context.setProgress(100);
        setIsLoading(false);
      });

      setSingleOrder(res.products);
    });
  };

  return (
    <>
      <div className="right-content w-100">
        <div className="print-header d-none d-print-block">
          <h1>Orders List</h1>
          <p>Generated on {new Date().toLocaleString()}</p>
        </div>
        
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <h5 className="mb-0">Orders List</h5>

          <div className="ml-auto d-flex align-items-center">
            

            <Breadcrumbs
              aria-label="breadcrumb"
              className="ml-auto breadcrumbs_"
            >
              <StyledBreadcrumb
                component="a"
                href="#"
                label="Dashboard"
                icon={<HomeIcon fontSize="small" />}
              />

              <StyledBreadcrumb
                label="Orders"
                deleteIcon={<ExpandMoreIcon />}
              />
            </Breadcrumbs>
          </div>
        </div>

        <div className="card shadow border-0 p-3 mt-4 orders-table-container">
          <div className="print-title d-none d-print-block mb-4">
            <h2>Maki E-commerce Orders</h2>
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <h3>Total Sales (Delivered Orders): ₱{calculateDeliveredSales().toFixed(2)}</h3>
          </div>
          
          {/* Total Sales Display (Screen only) */}
          <div className="mb-3 d-print-none">
            <h5 style={{ color: '#2E7D32' }}>
              Total Sales (Delivered Orders): ₱{calculateDeliveredSales().toFixed(2)}
            </h5>
          </div>
          
          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {orders?.length !== 0 &&
                    orders
                      ?.slice(
                        page1 * rowsPerPage,
                        page1 * rowsPerPage + rowsPerPage
                      )
                    ?.map((order, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span className="text-blue fonmt-weight-bold">
                                {order?.orderId || order?._id}
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span className="text-blue fonmt-weight-bold">
                                {order?.paymentId}
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span
                                className="text-blue fonmt-weight-bold cursor"
                                onClick={() => showProducts(order?._id)}
                              >
                                Click here to view
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {order?.name}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <FaPhoneAlt /> {order?.phoneNumber}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {order?.address}
                            </TableCell>
                            <TableCell>{order?.pincode}</TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              ₱{order?.amount}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <MdOutlineEmail /> {order?.email}
                            </TableCell>
                            <td>{order?.userid}</td>
                            <TableCell 
                              style={{ minWidth: columns.minWidth }}
                              data-value={order?.status || 'None'}
                            >
                              <Select
                                disabled={isLoading === true || order?.status === 'delivered'}
                                value={ order?.status !== null ? order?.status : statusVal }
                                onChange={(e) =>
                                  handleChangeStatus(e, order?._id)
                                }
                                displayEmpty
                                inputProps={{ "aria-label": "Without label" }}
                                size="small"
                                className="w-100"
                              >
                                <MenuItem value={null}>
                                  <em value={null}>None</em>
                                </MenuItem>

                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="confirm">Confirm</MenuItem>
                                <MenuItem value="in-transit">In Transit</MenuItem>
                                <MenuItem value="delivered">Delivered</MenuItem>
                              </Select>
                            </TableCell>
                         
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <MdOutlineDateRange />{" "}
                              {order?.date?.split("T")[0]}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<FaPrint />}
                                onClick={() => printReceipt(order?._id)}
                              >
                                Print Receipt
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={orders?.length}
              rowsPerPage={rowsPerPage}
              page={page1}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>

          <div className="print-footer d-none d-print-block">
            <p>Page <span className="pageNumber"></span></p>
            <p>Generated from Maki E-commerce Admin Panel</p>
          </div>
        </div>
      </div>

      <Dialog open={isOpenModal} className="productModal">
        <Button className="close_" onClick={() => setIsOpenModal(false)}>
          <MdClose />
        </Button>
        <h4 class="mb-1 font-weight-bold pr-5 mb-4">Products</h4>

        <div className="table-responsive orderTable">
          <table className="table table-striped table-bordered">
            <thead className="thead-dark">
              <tr>
                <th>Product Id</th>
                <th>Product Title</th>
                <th>Image</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>SubTotal</th>
              </tr>
            </thead>

            <tbody>
              {products?.length !== 0 &&
                products?.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td>{item?.productId}</td>
                      <td style={{ whiteSpace: "inherit" }}>
                        <span>{item?.productTitle?.substr(0, 30) + "..."}</span>
                      </td>
                      <td>
                        <div className="img">
                          <img src={item.image} />
                        </div>
                      </td>
                      <td>{item?.quantity}</td>
                      <td>{item?.price}</td>
                      <td>{item?.subTotal}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Dialog>

      <Dialog open={isRiderModalOpen} className="riderModal" onClose={() => setIsRiderModalOpen(false)}>
        <h4 className="mb-1 font-weight-bold p-2 mb-4 text-center">Delivery Rider & QR</h4>

        <div style={{ padding: 16, minWidth: 420 }}>
          {selectedOrderForRider ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <strong>Order:</strong> {selectedOrderForRider.orderId || selectedOrderForRider._id}
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong>Current Rider:</strong>{' '}
                {selectedOrderForRider.deliveryRider || 'Not assigned'}
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong>QR:</strong>
                <div style={{ marginTop: 8 }}>
                  {selectedOrderForRider.qr ? (
                    <div>
                      <img src={selectedOrderForRider.qr} alt="order-qr" style={{ maxWidth: 200 }} />
                      <div style={{ marginTop: 8 }}>
                        <Button size="small" variant="outlined" onClick={() => copyToClipboard(selectedOrderForRider.riderToken)}>
                          Copy Token
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#777' }}>QR not generated</div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong>Assign Rider</strong>
                <div style={{ marginTop: 8 }}>
                  <Select
                    value={selectedRiderId || ''}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    displayEmpty
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {riders?.map((r) => (
                      <MenuItem key={r._id} value={r._id}>
                        {r.name} - {r.email}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button disabled={assigningLoading} variant="contained" color="primary" onClick={handleAssignRider}>
                  {assigningLoading ? 'Assigning...' : 'Assign Rider'}
                </Button>
                <Button variant="outlined" onClick={() => setIsRiderModalOpen(false)}>Close</Button>
              </div>
            </>
          ) : (
            <div style={{ padding: 12 }}>Loading...</div>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default Orders;