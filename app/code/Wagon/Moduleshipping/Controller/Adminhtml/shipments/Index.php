<?php

namespace Wagon\Moduleshipping\Controller\Adminhtml\shipments;

use Magento\Backend\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;

class Index extends \Magento\Backend\App\Action
{
    /**
     * @var PageFactory
     */
    protected $resultPagee;

    /**
     * @param Context $context
     * @param PageFactory $resultPageFactory
     */
    public function __construct(
        Context $context,
        PageFactory $resultPageFactory
    ) {
        parent::__construct($context);
        $this->resultPageFactory = $resultPageFactory;
    }

    /**
     * Index action
     *
     * @return void
     */
    public function execute()
    {
        /** @var \Magento\Backend\Model\View\Result\Page $resultPage */
        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('Wagon_Moduleshipping::shipments');
        $resultPage->addBreadcrumb(__('Wagon'), __('Wagon'));
        $resultPage->addBreadcrumb(__('Manage item'), __('View Shipments'));
        $resultPage->getConfig()->getTitle()->prepend(__('View Shipments'));

        return $resultPage;
    }
}
?>