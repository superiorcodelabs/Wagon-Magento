<?php
namespace Wagon\Moduleshipping\Model\ResourceModel;

class Shipments extends \Magento\Framework\Model\ResourceModel\Db\AbstractDb
{
    /**
     * Initialize resource model
     *
     * @return void
     */
    protected function _construct()
    {
        $this->_init('wagon_shipment', 'id');
    }
}
?>
