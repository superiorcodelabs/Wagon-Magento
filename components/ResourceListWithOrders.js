import gql from "graphql-tag";
import { useLazyQuery } from "react-apollo";
import { useEffect, useState, useRef, useCallback } from "react";
import {
    Card,
    Button,
    DataTable,
    ButtonGroup,
    Link,
    Badge,
    Spinner,
    Banner,
    Pagination,
    Tooltip,
    Icon,
    List,
    Caption,
    TextStyle,
    Modal,
    TextContainer,
} from "@shopify/polaris";
import { CircleTickMajor } from "@shopify/polaris-icons";
import areaOptions from "../data/areaOptions";
import { default as RSelect } from "react-select";

const GET_ORDERS = gql`
    query getOrders($first: Int, $after: String, $last: Int, $before: String) {
        shop {
            url
        }
        orders(
            first: $first
            reverse: true
            after: $after
            last: $last
            before: $before
        ) {
            pageInfo {
                hasNextPage
                hasPreviousPage
            }
            edges {
                cursor
                node {
                    id
                    legacyResourceId
                    name
                    createdAt
                    customer {
                        displayName
                    }
                    originalTotalPriceSet {
                        presentmentMoney {
                            amount
                            currencyCode
                        }
                    }
                    displayFulfillmentStatus
                    shippingAddress {
                        formatted
                    }
                    metafield(
                        namespace: "go_wagon"
                        key: "go_wagon_shipment_id"
                    ) {
                        id
                        key
                        value
                    }
                    customAttributes {
                        key
                        value
                    }
                }
            }
        }
    }
`;

const PAGE_LIMIT = 10;

function ResourceListWithOrders(props) {
    const [formLoading, setFormLoading] = useState(false);
    const [pagination, setPagination] = useState({
        first: PAGE_LIMIT,
        last: null,
        after: null,
        before: null,
    });
    const [orders, setOrders] = useState([]);
    const [shop, setShop] = useState({});
    const [pageInfo, setPageInfo] = useState({});
    const [active, setActive] = useState(false);
    const [areaLoading, setAreaLoading] = useState(false);
    const [orderArea, setOrderArea] = useState("");
    const [orderAreaIndex, setOrderAreaIndex] = useState(-1);
    const toggleModal = useCallback(() => {
        setLocalOrderArea(-1);
        setActive((active) => !active);
    }, []);
    const selectedArea = useCallback(
        () =>
            areaOptions.find((option) => {
                return option.value === orderArea;
            }),
        [orderArea]
    );

    const [
        getOrders,
        { loading, error, data, called },
    ] = useLazyQuery(GET_ORDERS, { variables: pagination });

    useEffect(() => {
        let isSubscribed = true;

        getOrders();

        if (data && isSubscribed) {
            const { pageInfo } = data.orders;
            setShop(data.shop);
            setPageInfo(pageInfo);

            const myOrders = data.orders.edges.map((order) => {
                const wagonArea = order.node.customAttributes.find(
                    (attr) => attr.key === "go_wagon_area"
                );
                return {
                    cursor: order.cursor,
                    ...order.node,
                    checked: false,
                    wagonArea: wagonArea?.value,
                };
            });
            setOrders(myOrders);
        }

        return () => (isSubscribed = false);
    }, [data, pagination]);

    if (called && loading) {
        return <Spinner accessibilityLabel="Fetching Orders..." size="large" />;
    }

    if (error) {
        return (
            <Banner title="Error" status="critical">
                <p>{error?.message}</p>
            </Banner>
        );
    }

    return (
        <Card>
            <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={[
                    "Order",
                    "Date",
                    "Customer",
                    "Total",
                    "Address",
                    "Fulfillment",
                    "Shipment ID",
                    "Action",
                ]}
                rows={orders.map((order, index) => {
                    const {
                        legacyResourceId,
                        name,
                        createdAt,
                        originalTotalPriceSet,
                        displayFulfillmentStatus,
                        customer,
                        metafield,
                    } = order;

                    const legacyResourceIdString = String(legacyResourceId);

                    return [
                        <Link
                            url={`${shop.url}/admin/orders/${legacyResourceIdString}`}
                            external={true}
                        >
                            {name}
                        </Link>,
                        formatDate(createdAt),
                        customer.displayName,
                        <span>
                            {originalTotalPriceSet.presentmentMoney.amount}
                            {
                                originalTotalPriceSet.presentmentMoney
                                    .currencyCode
                            }
                        </span>,
                        <List>
                            <List.Item>
                                <TextContainer>
                                    <TextStyle variation="strong">
                                        Area &nbsp;
                                        <Button
                                            size="slim"
                                            onClick={() => {
                                                toggleModal();
                                                setLocalOrderArea(index);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    </TextStyle>
                                    <Caption>
                                        {order.wagonArea ? (
                                            order.wagonArea
                                        ) : (
                                            <Badge status="warning">N/A</Badge>
                                        )}
                                    </Caption>
                                </TextContainer>
                            </List.Item>
                            <List.Item>
                                <TextContainer>
                                    <TextStyle variation="strong">
                                        Shipping
                                    </TextStyle>
                                    <Caption>
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: order.shippingAddress.formatted.join(
                                                    "<br>"
                                                ),
                                            }}
                                        />
                                    </Caption>
                                </TextContainer>
                            </List.Item>
                        </List>,
                        <Badge>{displayFulfillmentStatus}</Badge>,
                        <Tooltip
                            content="Go Wagon Shipment ID"
                            dismissOnMouseOut
                        >
                            <Badge
                                status={
                                    metafield?.key === "go_wagon_shipment_id"
                                        ? "success"
                                        : "warning"
                                }
                            >
                                {metafield?.key === "go_wagon_shipment_id"
                                    ? `#${metafield.value}`
                                    : "N/A"}
                            </Badge>
                        </Tooltip>,
                        <ButtonGroup segmented>
                            <Tooltip content="Approve" dismissOnMouseOut>
                                <Button
                                    primary
                                    onClick={() => approveOrder(index)}
                                    disabled={
                                        metafield?.key ===
                                            "go_wagon_shipment_id" ||
                                        formLoading
                                    }
                                >
                                    <Icon source={CircleTickMajor} />
                                </Button>
                            </Tooltip>
                        </ButtonGroup>,
                    ];
                })}
                footerContent={`Showing ${orders.length} of ${orders.length} results`}
            />

            <div className="center-align">
                <Card.Section>
                    <Pagination
                        hasPrevious={pageInfo.hasPreviousPage}
                        onPrevious={previousPaginate}
                        hasNext={pageInfo.hasNextPage}
                        onNext={nextPaginate}
                    />
                </Card.Section>
            </div>

            <div>
                <Modal
                    open={active}
                    onClose={toggleModal}
                    title="Select Drop Address"
                    primaryAction={{
                        content: "Save",
                        onAction: saveArea,
                    }}
                    limitHeight={false}
                    loading={areaLoading}
                    style={{ "overflow-x": "visible" }}
                >
                    <Modal.Section>
                        <div style={{ height: "380px" }}>
                            <label htmlFor="gw-field-area" className="gw-label">
                                Area
                            </label>
                            <RSelect
                                options={areaOptions}
                                name="gw_field_area"
                                className="gw-input"
                                inputId="gw-field-area"
                                value={selectedArea()}
                                onChange={(event) => handleChange(event)}
                            />
                        </div>
                    </Modal.Section>
                </Modal>
            </div>
        </Card>
    );

    function setLocalOrderArea(index) {
        const order = orders[index];
        if (order) {
            setOrderArea(order.wagonArea);
            setOrderAreaIndex(index);
        } else {
            setOrderArea("");
            setOrderAreaIndex(-1);
        }
    }

    function handleChange(event) {
        const { value } = event;
        setOrderArea(value);
    }

    async function saveArea() {
        if (orderAreaIndex < 0) {
            return;
        }

        if (!orderArea) {
            return;
        }

        const order = orders[orderAreaIndex];
        setAreaLoading(true);

        const area = selectedArea();
        const { latitude, longitude } = area;

        try {
            const res = await fetch(`/api/area-update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    object_id: order.legacyResourceId,
                    address: {
                        area: orderArea,
                        latitude,
                        longitude,
                    },
                }),
            });

            const body = await res.json();

            if (!res.ok) {
                throw new Error(body.message);
            }

            orders[orderAreaIndex].wagonArea = orderArea;
            setOrders(orders);

            toggleModal();
            props.setToast("Area Updated");
        } catch (e) {
            console.error(e.message);
            props.setToast(`Failed: ${e.message}`, true);
        } finally {
            setAreaLoading(false);
        }
    }

    async function approveOrder(index) {
        const order = orders[index];

        setFormLoading(true);

        try {
            const res = await fetch(`/api/order-approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ object_id: order.legacyResourceId }),
            });

            const body = await res.json();

            if (!res.ok) {
                throw new Error(body.message);
            }

            const newOrderProps = body.order;
            const customAttributes = newOrderProps?.customAttributes;
            const metafields = newOrderProps?.metafields;

            if (customAttributes) {
                orders[index].customAttributes = customAttributes;
            }

            if (metafields) {
                metafields.edges.some((metafield) => {
                    if (metafield.node.key === "go_wagon_shipment_id") {
                        orders[index].metafield = metafield.node;
                        return true;
                    }
                });
            }

            if (metafields || customAttributes) {
                setOrders(orders);
            }

            props.setToast(body.message);
        } catch (e) {
            console.error(e.message);
            props.setToast(`Failed: ${e.message}`, true);
        } finally {
            setFormLoading(false);
        }
    }

    function previousPaginate() {
        const { cursor } = orders[0];
        setPagination({
            after: null,
            first: null,
            before: cursor,
            last: PAGE_LIMIT,
        });
    }

    function nextPaginate() {
        const lastElementIndex = orders.length - 1;
        const { cursor } = orders[lastElementIndex];
        setPagination({
            after: cursor,
            first: PAGE_LIMIT,
            before: null,
            last: null,
        });
    }

    /**
     *
     * @param {String} whatsTheDate
     * @returns {String}
     */
    function formatDate(whatsTheDate) {
        const newDate = new Date(Date.parse(whatsTheDate));
        const finalDate = new Intl.DateTimeFormat([], {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
            timeZone: "America/New_York",
            year: "numeric",
        }).format(newDate);

        return finalDate;
    }
}

export default ResourceListWithOrders;
