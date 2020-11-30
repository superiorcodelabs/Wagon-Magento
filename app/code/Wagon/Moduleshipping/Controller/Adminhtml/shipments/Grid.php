<?php
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

/**
 * Created By : Digital Aptech
 */
namespace Wagon\Moduleshipping\Controller\Adminhtml\shipments;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\RawFactory;
use Magento\Framework\View\LayoutFactory;

/**
 * Grid Controller
 */
class Grid extends Action
{

    /**
     * @var Rawfactory
     */
    protected $resultRawFactory;

    /**
     * @var LayoutFactory
     */
    protected $layoutFactory;

    /**
     * @param Context       $context
     * @param Rawfactory    $resultRawFactory
     * @param LayoutFactory $layoutFactory
     */
    public function __construct(
        Context $context,
        Rawfactory $resultRawFactory,
        LayoutFactory $layoutFactory
    ) {
        parent::__construct($context);
        $this->resultRawFactory = $resultRawFactory;
        $this->layoutFactory = $layoutFactory;
    }

    /**
     * @return \Magento\Framework\Controller\Result\RawFactory
     */
    public function execute()
    {
        $resultRaw = $this->resultRawFactory->create();
        $wagonHtml = $this->layoutFactory->create()->createBlock(
            'Wagon\Moduleshipping\Block\Adminhtml\Shipments\Grid',
            'shipments.view.grid'
        )->toHtml();
        return $resultRaw->setContents($wagonHtml);
    }
}