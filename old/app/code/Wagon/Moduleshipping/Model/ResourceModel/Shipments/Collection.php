<?php

namespace Wagon\Moduleshipping\Model\ResourceModel\Shipments;

class Collection extends \Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection
{

    /**
     * Define resource model
     *
     * @return void
     */
    protected function _construct()
    {
        $this->_init('Wagon\Moduleshipping\Model\Shipments', 'Wagon\Moduleshipping\Model\ResourceModel\Shipments');
        $this->_map['fields']['page_id'] = 'main_table.page_id';
    }

}
?>