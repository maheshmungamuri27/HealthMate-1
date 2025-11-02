import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { getOrderHistory } from '../services/mockApiService';
import type { Order } from '../types';
import Card from './common/Card';
import { useApp } from '../hooks/useApp';

const OrderHistory: React.FC = () => {
    const t = useTranslations();
    const { user } = useApp();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            if (user) {
                setIsLoading(true);
                const pastOrders = await getOrderHistory(user.uid);
                setOrders(pastOrders);
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [user]);
    
    const toggleDetails = (orderId: string) => {
        setExpandedOrderId(prevId => prevId === orderId ? null : orderId);
    }

    if (isLoading) {
        return <div className="text-center">{t('loading')}...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-dark">{t('orderHistory')}</h1>
            
            {orders.length === 0 ? (
                <Card className="text-center py-12">
                    <p className="text-gray-500">{t('noOrders')}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <Card key={order.id}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                <div>
                                    <p className="text-xs text-gray-500">{t('orderId')}</p>
                                    <p className="font-mono text-sm font-semibold">{order.id.substring(0, 8)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('date')}</p>
                                    <p className="font-semibold text-sm">{new Date(order.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('total')}</p>
                                    <p className="font-bold text-lg">₹{order.total.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => toggleDetails(order.id)}
                                    className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg w-full md:w-auto"
                                >
                                    {expandedOrderId === order.id ? t('hideDetails') : t('viewDetails')}
                                </button>
                            </div>
                            {expandedOrderId === order.id && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="font-bold mb-2">{t('items')} from {order.hospitalName}</h4>
                                    <ul className="space-y-1 text-sm text-gray-700">
                                        {order.items.map(item => (
                                            <li key={item.id} className="flex justify-between">
                                                <span>{item.name} x {item.quantity}</span>
                                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {order.deliveryAddress && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h5 className="font-semibold text-sm text-dark">{t('deliveryDetails')}</h5>
                                            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                                            <p className="text-sm text-gray-600">Scheduled for: {order.deliveryDate} at {order.deliveryTime}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;