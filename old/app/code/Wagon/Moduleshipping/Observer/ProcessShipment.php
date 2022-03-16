<?php
namespace Wagon\Moduleshipping\Observer;

use Magento\Framework\Event\ObserverInterface;

class ProcessShipment implements ObserverInterface
{
    protected $dataHelper;

    public function __construct(\Wagon\Moduleshipping\Helper\Data $dataHelper) {
        $this->dataHelper = $dataHelper;
    }
    /**
     *
     * @param \Magento\Framework\Event\Observer $observer
     * @return $this
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $shipment = $observer->getEvent()->getShipment();
        $order = $shipment->getOrder();

        $writer = new \Zend\Log\Writer\Stream(BP . '/var/log/templog.log');
        $logger = new \Zend\Log\Logger();
        $logger->addWriter($writer);

        $logger->info("Info 000009". $order->getId());

        $this->dataHelper->createShipment($shipment,$order);
        
        // your code for sms here

        //$this->createCustomshipment($shipment);
    }
}