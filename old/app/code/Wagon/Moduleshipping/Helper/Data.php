<?php

namespace Wagon\Moduleshipping\Helper;

use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Store\Model\ScopeInterface;

/**
 * Class Data
 * Get configuration from the admin
 */
class Data extends AbstractHelper
{
    public function createShipment($shipment,$order)
    {
        $writer = new \Zend\Log\Writer\Stream(BP . '/var/log/templog1.log');
        $logger = new \Zend\Log\Logger();
        $logger->addWriter($writer);

        $lat = '';
        $lon = '';
        //$logger->info("Info". BP); die;
        //$logger->info("Info". $order->getId());
        $shippingAddress = $order->getShippingAddress();
        $billingAddress = $order->getBillingAddress();
        
        $areaSelector = $billingAddress->getRegion();
        $logger->info("Info". $areaSelector);
        $block = explode('Block ',$areaSelector);

        $latlonS = $this->getLatLong($areaSelector,BP);
        if(!empty($latlonS)){
            $latlonArr = explode('|',$latlonS);
            $lat = $latlonArr[0];
            $lon = $latlonArr[1];
        }
        $street = $shippingAddress->getStreet();

        $shipArr['email'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_email');
        $shipArr['password'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pass');
        $shipArr['secret_key'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_key');
        $shipArr['pickup_area'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pickup_area');
        $shipArr['pickup_block'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pickup_block');
        $shipArr['pickup_street'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pickup_street');
        $shipArr['pickup_address'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pickup_address');
        $shipArr['pickup_latitude'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pickup_latitude');
        $shipArr['pickup_longitude'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pickup_lognitude');
        $shipArr['pickup_additional_details'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pickup_additional_details');
        $shipArr['drop_area'] = $areaSelector;
        $shipArr['drop_block'] = $block[1];
        $shipArr['drop_street'] = $shippingAddress->getCity();
        $shipArr['drop_address'] = $street[0];
        $shipArr['drop_latitude'] = $lat;
        $shipArr['drop_longitude'] = $lon;
        $shipArr['drop_additional_details'] = '';
        $shipArr['receiver_name'] = $billingAddress->getFirstname() . ' ' .$billingAddress->getLastname();
        $shipArr['receiver_phone'] = $billingAddress->getTelephone();
        $shipArr['shipment_package_name'] = $billingAddress->getFirstname() . ' ' .$billingAddress->getLastname();
        $shipArr['shipment_package_value'] = $order->getGrandTotal();
        $shipArr['invoice_no'] = $order->getId();
        $shipArr['scheduled_date'] = '';
        $shipArr['scheduled_time'] = '';

        $url = 'http://go-wagon.com/wagon_backendV2/public/thirdparty/api/create_shipment';
        $shipStr= json_encode($shipArr);

        $ch = curl_init( $url );
        # Setup request to send json via POST.
        $payload = $shipStr;
        curl_setopt( $ch, CURLOPT_POSTFIELDS, $payload );
        curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
        # Return response instead of printing.
        curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
        # Send request.
        $result = curl_exec($ch);
        curl_close($ch);
        
        //$logger->info("Info". $result);
        $resArr = json_decode($result, true);
        //$logger->info("Info". $resArr['status']."---".$resArr['data']['shipment_id']);
        

        if($resArr['status'] == '1'){
            $shipmentGetdata = $this->getShipment($resArr['data']['shipment_id']);

            $shipmentGetdataArr = json_decode($shipmentGetdata,true);
            $content = $shipmentGetdata;
            $logger->info("Info -->". print_r($shipmentGetdataArr,true));

            $receiver_phone = '+'.$shipmentGetdataArr['data']['shipment_details']['receiver_phone_code'].' '.$shipmentGetdataArr['data']['shipment_details']['receiver_phone'];
            $drop_address = $shipmentGetdataArr['data']['shipment_details']['drop_address'];
            $drop_latitude = $shipmentGetdataArr['data']['shipment_details']['drop_latitude'];
            $drop_longitude = $shipmentGetdataArr['data']['shipment_details']['drop_longitude'];
            $estimated_time = $shipmentGetdataArr['data']['shipment_details']['estimated_time'];
            $total_distance = $shipmentGetdataArr['data']['shipment_details']['total_distance'];
            $polyline = $shipmentGetdataArr['data']['shipment_details']['polyline'];
            $fare = $shipmentGetdataArr['data']['shipment_details']['fare'];
            $pickup_date = $shipmentGetdataArr['data']['shipment_details']['pickup_date'];
            $status = $shipmentGetdataArr['data']['shipment_details']['status'];


            $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
            $resource = $objectManager->get('Magento\Framework\App\ResourceConnection');
            $connection = $resource->getConnection();

             $themeTable = $resource->getTableName('wagon_shipment');
             $sql = "INSERT INTO " . $themeTable . "(id,title,content,receiver_phone,drop_address,drop_latitude,drop_longitude,estimated_time,total_distance,polyline,fare,pickup_date,status,order_id,shipment_id) VALUES ('','".$shipArr['shipment_package_name']."','".$shipmentGetdata."','".$receiver_phone."','".$drop_address."','".$drop_latitude."','".$drop_longitude."','".$estimated_time."','".$total_distance."','".$polyline."','".$fare."','".$pickup_date."','".$status."','".$order->getIncrementId()."','".$resArr['data']['shipment_id']."')";
             $connection->query($sql);
            
            
            return true;
        }else{
            $message = 'Can not save shipment. '.$resArr['message'];
            throw new \Magento\Framework\Exception\LocalizedException(__($message));
            return;
        }
    }

    public function getShipment($shipment_id)
    {
        $shipArr['email'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_email');
        $shipArr['password'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_pass');
        $shipArr['secret_key'] = $this->getConfig('carriers/wagon_moduleshipping/wagon_key');
        $shipArr['id'] = $shipment_id;

        $url = 'http://go-wagon.com/wagon_backendV2/public/thirdparty/api/get_shipment_details';
        $shipStr= json_encode($shipArr);

        $ch = curl_init( $url );
        # Setup request to send json via POST.
        $payload = $shipStr;
        curl_setopt( $ch, CURLOPT_POSTFIELDS, $payload );
        curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
        # Return response instead of printing.
        curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
        # Send request.
        $result = curl_exec($ch);
        curl_close($ch);

        return $result;
    }

    public function getLatLong($area = '',$baseP){
        //
        $latlon = '';
        $file = fopen($baseP."/pub/media/location/area.csv","r");
        //print_r(fgetcsv($csv_map));
        $i=0;
        while(! feof($file))
        {
        //print_r(fgetcsv($file));
        if($i!=0){
        $csv_map[] = fgetcsv($file);
        }
        $i++;
        }
        $writer = new \Zend\Log\Writer\Stream(BP . '/var/log/templog.log');
        $logger = new \Zend\Log\Logger();
        $logger->addWriter($writer);

       

        foreach($csv_map as $key=>$val){
            if(strtolower($val[2]) == strtolower($area)){
                $latlon = $val[0].'|'.$val[1];
                $logger->info("Info".$key.'--->'.$latlon);
            }
        }
        return $latlon;
    }

    public function getArea(){
        //
        $latlon = '';
        $file = fopen(BP . "/pub/media/location/area.csv","r");
        //print_r(fgetcsv($csv_map));
        $i=0;
        while(! feof($file))
        {
        //print_r(fgetcsv($file));
        if($i!=0){
        $csv_map[] = fgetcsv($file);
        }
        $i++;
        }
        

        foreach($csv_map as $key=>$val){
            if($key > 0 && !empty($val[2])){
                $myArr[$key]['label'] = $val[2];
                $myArr[$key]['value'] = $val[2];    
            }
            // if(strtolower($val[2]) == strtolower($area)){
            //     $latlon = $val[0].'|'.$val[1];
            //     $logger->info("Info".$key.'--->'.$latlon);
            // }
        }

        return $myArr;
    }
    /**
     * Return store configuration value.
     *
     * @param string $path
     * @param int $storeId
     * @return mixed
     */
    public function getConfig($path, $storeId = null)
    {
        return $this->scopeConfig->getValue($path, ScopeInterface::SCOPE_STORE, $storeId);
    }
}