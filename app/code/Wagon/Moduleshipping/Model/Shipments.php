<?php
namespace Wagon\Moduleshipping\Model;

class Shipments extends \Magento\Framework\Model\AbstractModel
{
    /**
     * Initialize resource model
     *
     * @return void
     */
    protected function _construct()
    {
        $this->_init('Wagon\Moduleshipping\Model\ResourceModel\Shipments');
    }
}
?>