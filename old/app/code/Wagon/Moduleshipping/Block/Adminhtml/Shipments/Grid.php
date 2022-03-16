<?php
namespace Wagon\Moduleshipping\Block\Adminhtml\Shipments;

class Grid extends \Magento\Backend\Block\Widget\Grid\Extended
{
    /**
     * @var \Magento\Framework\Module\Manager
     */
    protected $moduleManager;

    /**
     * @var \Jevy\BolProductContent\Model\wagonFactory
     */
    protected $_wagonFactory;

    /**
     * @var \Jevy\BolProductContent\Model\Status
     */
    //protected $_status;

    /**
     * @param \Magento\Backend\Block\Template\Context $context
     * @param \Magento\Backend\Helper\Data $backendHelper
     * @param \Jevy\BolProductContent\Model\workDiaryFactory $workDiaryFactory
     * @param \Jevy\BolProductContent\Model\Status $status
     * @param \Magento\Framework\Module\Manager $moduleManager
     * @param array $data
     *
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     */
    public function __construct(
        \Magento\Backend\Block\Template\Context $context,
        \Magento\Backend\Helper\Data $backendHelper,
        \Wagon\Moduleshipping\Model\ShipmentsFactory $ShipmentsFactory,
        \Magento\Framework\Module\Manager $moduleManager,
        array $data = []
    ) {
        $this->_wagonFactory = $ShipmentsFactory;
        //$this->_status = $status;
        $this->moduleManager = $moduleManager;
        parent::__construct($context, $backendHelper, $data);
    }

    /**
     * @return void
     */
    protected function _construct()
    {
        parent::_construct();
        $this->setId('postGrid');
        $this->setDefaultSort('id');
        $this->setDefaultDir('DESC');
        $this->setSaveParametersInSession(true);
        $this->setUseAjax(false);
        $this->setVarNameFilter('post_filter');
    }

    /** 
     * @return $this
     */
    protected function _prepareCollection()
    {
        $collection = $this->_wagonFactory->create()->getCollection();
        $this->setCollection($collection);

        parent::_prepareCollection();

        return $this;
    }

    /**
     * @return $this
     * @SuppressWarnings(PHPMD.ExcessiveMethodLength)
     */
    protected function _prepareColumns()
    {   
        $this->addColumn(
            'id',
            [
                'header' => __('ID'),
                'type' => 'number',
                'index' => 'id',
                'header_css_class' => 'col-id',
                'column_css_class' => 'col-id',
            ]
        );

        
        $this->addColumn(
            'order_id',
            [
                'header' => __('Order ID#'),
                'index' => 'order_id',
            ]
        );

        $this->addColumn(
            'Status',
            [
                'header' => __('Status'),
                'index' => 'status',
            ]
        );
        $this->addColumn(
            'title',
            [
                'header' => __('Receiver Name'),
                'index' => 'title',
            ]
        );
        $this->addColumn(
            'receiver_phone',
            [
                'header' => __('Reciver Phone'),
                'index' => 'receiver_phone',
                'type' => 'html',
            ]
        );

        $this->addColumn(
            'drop_address',
            [
                'header' => __('Drop Address'),
                'index' => 'drop_address',
                'type' => 'html',
            ]
        );
        $this->addColumn(
            'drop_latitude',
            [
                'header' => __('Drop Lat'),
                'index' => 'drop_latitude',
                'type' => 'html',
            ]
        );
        $this->addColumn(
            'drop_longitude',
            [
                'header' => __('Drop Lon'),
                'index' => 'drop_longitude',
                'type' => 'html',
            ]
        );
        $this->addColumn(
            'estimated_time',
            [
                'header' => __('Estimated Time'),
                'index' => 'estimated_time',
                'type' => 'html',
            ]
        );
        $this->addColumn(
            'polyline',
            [
                'header' => __('Polyline'),
                'index' => 'polyline',
                'type' => 'html',
            ]
        );
        $this->addColumn(
            'total_distance',
            [
                'header' => __('Distance'),
                'index' => 'total_distance',
                'type' => 'html',
            ]
        );
        $this->addColumn(
            'fare',
            [
                'header' => __('Fare'),
                'index' => 'fare',
                'type' => 'html',
            ]
        );
        $this->addColumn(
            'pickup_date',
            [
                'header' => __('Pickup Date'),
                'index' => 'pickup_date',
                'type' => 'html',
            ]
        );

        $this->addColumn(
            'added_date',
            [
                'header' => __('Date'),
                'index' => 'added_date',
            ]
        );

        // $this->addColumn(
        //     'status',
        //     [
        //         'header' => __('Status'),
        //         'index' => 'status',
        //         'type' => 'options',
        //         'options' => $this->_status->getOptionArray(),
        //     ]
        // );

        // $this->addColumn(
        //     'created_at',
        //     [
        //         'header' => __('Created At'),
        //         'index' => 'created_at',
        //     ]
        // );

        // $this->addColumn(
        //     'edit',
        //     [
        //         'header' => __('Edit'),
        //         'type' => 'action',
        //         'getter' => 'getId',
        //         'actions' => [
        //             [
        //                 'caption' => __('Edit'),
        //                 'url' => [
        //                     'base' => 'workdiary/*/edit',
        //                 ],
        //                 'field' => 'id',
        //             ],
        //         ],
        //         'filter' => false,
        //         'sortable' => false,
        //         'index' => 'stores',
        //         'header_css_class' => 'col-action',
        //         'column_css_class' => 'col-action',
        //     ]
        // );

        // $this->addColumn(
        //     'delete',
        //     [
        //         'header' => __('Delete'),
        //         'type' => 'action',
        //         'getter' => 'getId',
        //         'actions' => [
        //             [
        //                 'caption' => __('Delete'),
        //                 'url' => [
        //                     'base' => 'workdiary/*/delete',
        //                 ],
        //                 'field' => 'id',
        //             ],
        //         ],
        //         'filter' => false,
        //         'sortable' => false,
        //         'index' => 'stores',
        //         'header_css_class' => 'col-action',
        //         'column_css_class' => 'col-action',
        //     ]
        // );

        $block = $this->getLayout()->getBlock('grid.bottom.links');

        if ($block) {
            $this->setChild('grid.bottom.links', $block);
        }

        return parent::_prepareColumns();
    }

	
    /**
     * @return $this
     */
    protected function _prepareMassaction()
    {
        return false;
        // $this->setMassactionIdField('id');
        // $this->getMassactionBlock()->setFormFieldName('id');

        // $this->getMassactionBlock()->addItem(
        //     'delete',
        //     [
        //         'label' => __('Delete'),
        //         'url' => $this->getUrl('workdiary/*/massDelete'),
        //         'confirm' => __('Are you sure?'),
        //     ]
        // );

        // return $this;
    }
		

    /**
     * @return string
     */
    public function getGridUrl()
    {
        return $this->getUrl('moduleshipping/*/index', ['_current' => true]);
    }

    /**
     * @param \Jevy\BolProductContent\Model\WorkDiary|\Magento\Framework\Object $row
     * @return string
     */
    public function getRowUrl($row)
    {
		
        return $this->getUrl(
            'moduleshipping/*/index',
            ['id' => $row->getId()]
        );
		
    }

	

}